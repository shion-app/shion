package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"

	"github.com/mitchellh/mapstructure"
	"github.com/samber/lo"
	"go.etcd.io/bbolt"
	"go.uber.org/multierr"
	"go.uber.org/zap/zapcore"
)

type Store struct {
	db *bbolt.DB
}

type Map = map[string]any

type Entity interface {
	transform(key string, value any) any
	getSearchBucket(args ...int) SearchBucketList
}

type Record struct {
	Id        int    `json:"id"`
	Name      string `json:"name"`
	Type      int    `json:"type"`
	Exe       string `json:"exe"`
	TotalTime int    `json:"totalTime"`
}

type Time struct {
	Id    int `json:"id"`
	Start int `json:"start"`
	End   int `json:"end"`
}

type SearchBucket struct {
	name string
	id   int
}

type SearchBucketList []SearchBucket

type QueryParam struct {
	value any
	field string
	op    Operator
}

const (
	APP_INFO = "appInfo"
	TIME     = "time"
	RECORD   = "record"
)

const (
	RECORD_TYPE_MANUAL = 0
	RECORD_TYPE_AUTO   = 1
)

func (r Record) transform(key string, value any) any {
	if v, ok := value.(float64); ok && lo.Contains([]string{"id", "type", "totalTime"}, key) {
		return int(v)
	}
	return value
}

func (r Record) isVaild() bool {
	return r.Id != 0
}

func (r Record) getSearchBucket(args ...int) SearchBucketList {
	return SearchBucketList{{
		name: RECORD,
	}}
}

func (t Time) transform(key string, value any) any {
	if v, ok := value.(float64); ok && lo.Contains([]string{"id", "start", "end"}, key) {
		return int(v)
	}
	return value
}

func (t Time) getSearchBucket(args ...int) SearchBucketList {
	return SearchBucketList{{
		name: RECORD,
		id:   args[0],
	}, {
		name: TIME,
	}}
}

func (q QueryParam) isVaild() bool {
	return q.value != nil && q.field != "" && q.op != ""
}

func (q QueryParam) MarshalLogObject(enc zapcore.ObjectEncoder) error {
	enc.AddReflected("value", q.value)
	enc.AddString("field", q.field)
	enc.AddString("op", q.op)
	return nil
}

func (s SearchBucket) MarshalLogObject(enc zapcore.ObjectEncoder) error {
	enc.AddString("name", s.name)
	enc.AddInt("id", s.id)
	return nil
}

func (s SearchBucketList) MarshalLogArray(arr zapcore.ArrayEncoder) error {
	var err error
	for i := range s {
		err = multierr.Append(err, arr.AppendObject(s[i]))
	}
	return err
}

func byteToIntOrString(b []byte) (any, bool) {
	s := string(b)
	i, err := stringToInt(s)
	if err != nil {
		return s, false
	}
	return i, true
}

func stringToInt(s string) (int, error) {
	return strconv.Atoi(s)
}

func intToByte(v int) []byte {
	return []byte(strconv.Itoa(v))
}

func combineKeyAndId(key string, id int) string {
	return fmt.Sprintf("%s%d", key, id)
}

func InitStore(dir string) Store {
	db, _ := bbolt.Open(filepath.Join(dir, "data.db"), 0666, nil)
	store := Store{db: db}
	store.initDatabase()
	return store
}

func (s *Store) initDatabase() {
	s.db.Update(func(tx *bbolt.Tx) error {
		tx.CreateBucketIfNotExists([]byte(APP_INFO))
		tx.CreateBucketIfNotExists([]byte(RECORD))
		updateDatabase(tx)
		if isDev {
			serialize(tx)
		}
		// deserialize(tx)
		return nil
	})
}

func traverseBucket(tx *bbolt.Tx, bucket *bbolt.Bucket, data Map, parentName string) {
	parent := data[parentName].(Map)
	bucket.ForEach(func(k, v []byte) error {
		key := string(k)
		value := string(v)
		nested := bucket.Bucket(k)
		if nested != nil {
			parent[key] = Map{}
			traverseBucket(tx, nested, parent, key)
		} else {
			isStruct := strings.HasPrefix(value, "{")
			if isStruct {
				var obj any
				json.Unmarshal(v, &obj)
				_, isInt := byteToIntOrString(k)
				isBucketStruct := isInt
				if isBucketStruct {
					if _, ok := parent["_data"]; !ok {
						parent["_data"] = []any{}
					}
					parent["_data"] = append(parent["_data"].([]any), obj)
				} else {
					parent[key] = obj
				}
			} else {
				parent[key] = value
			}
		}
		return nil
	})
}

func serialize(tx *bbolt.Tx) {
	data := Map{}
	tx.ForEach(func(name []byte, b *bbolt.Bucket) error {
		bucket := tx.Bucket(name)
		data[string(name)] = Map{}
		if bucket != nil {
			traverseBucket(tx, bucket, data, string(name))
		}
		return nil
	})
	str, _ := json.MarshalIndent(data, "", "  ")
	dir := GetAppConfigDir()
	jsonPath := filepath.Join(dir, "data.json")
	os.WriteFile(jsonPath, str, 0644)
}

func deserialize(tx *bbolt.Tx) {
	bucketNameList := [][]byte{}
	tx.ForEach(func(name []byte, b *bbolt.Bucket) error {
		bucketNameList = append(bucketNameList, name)
		return nil
	})
	lo.ForEach(bucketNameList, func(name []byte, _ int) {
		tx.DeleteBucket(name)
	})
	dir := GetAppConfigDir()
	jsonPath := filepath.Join(dir, "data.json")

	b, _ := os.ReadFile(jsonPath)
	var data Map
	json.Unmarshal(b, &data)

	for k, v := range data {
		bucket, _ := tx.CreateBucket([]byte(k))
		traverseMap(tx, bucket, v.(Map))
	}
}

func traverseMap(tx *bbolt.Tx, bucket *bbolt.Bucket, data Map) {
	for k, v := range data {
		if k == "_data" {
			lo.ForEach(v.([]any), func(item any, _ int) {
				b, _ := json.Marshal(item)
				uid, _ := bucket.NextSequence()
				id := int(item.(Map)["id"].(float64))
				for int(uid) != id {
					uid, _ = bucket.NextSequence()
				}
				bucket.Put(intToByte(id), b)
			})
		} else {
			switch reflect.TypeOf(v).Kind() {
			case reflect.Map:
				_, ok := v.(Map)["_data"]
				isBucketStruct := ok
				if isBucketStruct {
					nested, _ := bucket.CreateBucket([]byte(k))
					traverseMap(tx, nested, v.(Map))
				} else {
					b, _ := json.Marshal(v.(Map))
					bucket.Put([]byte(k), b)
				}
			case reflect.Float64:
				bucket.Put([]byte(k), intToByte(int(v.(float64))))
			case reflect.String:
				bucket.Put([]byte(k), []byte(v.(string)))
			}
		}
	}
}

func updateDatabase(tx *bbolt.Tx) {
	info := tx.Bucket([]byte(APP_INFO))
	// oldVersion := info.Get([]byte("version"))
	// update
	info.Put([]byte("version"), []byte(version))
}

func toMap(in Entity, data Map) Map {
	out := Map{}
	v := reflect.ValueOf(in)
	t := v.Type()
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		if tag := field.Tag.Get("json"); tag != "" {
			out[tag] = v.Field(i).Interface()
			if v, ok := data[tag]; ok {
				out[tag] = in.transform(tag, v)
			}
		}
	}
	return out
}

func fromMapList[T any](data []Map) ([]T, error) {
	result := []T{}
	for _, v := range data {
		var i T
		err := mapstructure.Decode(v, &i)
		if err != nil {
			return nil, err
		}
		result = append(result, i)
	}
	return result, nil
}

func getBucket(tx *bbolt.Tx, nested SearchBucketList) (*bbolt.Bucket, error) {
	length := len(nested)
	var bucket *bbolt.Bucket
	for i := 0; i < length; i++ {
		curr := nested[i]
		name := curr.name
		hasBefore := i != 0
		if hasBefore {
			name = combineKeyAndId(name, nested[i-1].id)
		}
		if bucket == nil {
			bucket = tx.Bucket([]byte(name))
		} else {
			bucket = bucket.Bucket([]byte(name))
		}
		if bucket == nil {
			return nil, bucketNotFound
		}
	}
	return bucket, nil
}

func (s *Store) insert(entity Entity, data Map, nested SearchBucketList) (int, error) {
	var id uint64
	err := s.db.Update(func(tx *bbolt.Tx) error {
		bucket, err := getBucket(tx, nested)
		if err != nil {
			return err
		}
		id, err = bucket.NextSequence()
		if err != nil {
			return err
		}
		data["id"] = int(id)
		dataMap := toMap(entity, data)
		b, err := json.Marshal(dataMap)
		if err != nil {
			return err
		}
		err = bucket.Put(intToByte(int(id)), b)
		if isDev {
			serialize(tx)
		}
		return err
	})
	if err != nil {
		logger.Sugar().Errorw(err.Error(), "data", data, "nested", nested)
		return 0, err
	}
	return int(id), nil
}

func (s *Store) InsertRecord(data Map) (int, error) {
	r := Record{}
	id, err := s.insert(r, data, r.getSearchBucket())
	if err != nil {
		return 0, err
	}
	err = s.db.Update(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(RECORD))
		name := combineKeyAndId(TIME, id)
		_, err = bucket.CreateBucket([]byte(name))
		return err
	})
	if err != nil {
		return 0, err
	}
	return id, err
}

func (s *Store) InsertTime(recordId int, data Map) (int, error) {
	t := Time{}
	id, err := s.insert(t, data, t.getSearchBucket(recordId))
	if err != nil {
		return 0, err
	}
	record, err := s.QueryRecordById(recordId)
	if err != nil {
		return 0, err
	}
	if record.isVaild() {
		totalTime := record.TotalTime + data["end"].(int) - data["start"].(int)
		err = s.UpdateRecord(recordId, Map{
			"totalTime": totalTime,
		})
	}
	if err != nil {
		return 0, err
	}
	return id, err
}

func (s *Store) query(entity Entity, nested SearchBucketList, param QueryParam) ([]Map, error) {
	result := []Map{}
	err := s.db.View(func(tx *bbolt.Tx) error {
		bucket, err := getBucket(tx, nested)
		if err != nil {
			return err
		}
		return bucket.ForEach(func(k, v []byte) error {
			if _, isInt := byteToIntOrString(k); !isInt {
				return nil
			}
			var instance Map
			err := json.Unmarshal(v, &instance)
			if err != nil {
				return err
			}
			vaild := true
			if param.isVaild() {
				value, target := entity.transform(param.field, param.value), entity.transform(param.field, instance[param.field])
				if a, ok := target.(int); ok {
					if b, ok := value.(int); ok {
						vaild, err = Compare(CompareOption[int]{
							a:  a,
							b:  b,
							op: param.op,
						})
					}
				} else if a, ok := target.(string); ok {
					if b, ok := value.(string); ok {
						vaild, err = Compare(CompareOption[string]{
							a:  a,
							b:  b,
							op: param.op,
						})
					}
				} else {
					return needAddQueryCompare
				}
			}
			if err != nil {
				return err
			}
			if vaild {
				result = append(result, instance)
			}
			return nil
		})
	})
	if err != nil {
		logger.Sugar().Errorw(err.Error(), "entity", entity, "nested", nested, "param", param)
		return nil, err
	}
	return result, nil
}

func (s *Store) QueryRecord(param QueryParam) ([]Record, error) {
	r := Record{}
	ml, err := s.query(r, r.getSearchBucket(), param)
	if err != nil {
		return nil, err
	}
	rl, err := fromMapList[Record](ml)
	return rl, err
}

func (s *Store) QueryRecordById(id int) (Record, error) {
	list, err := s.QueryRecord(QueryParam{
		value: id,
		field: "id",
		op:    eq,
	})
	if err != nil {
		return Record{}, err
	}
	if len(list) > 0 {
		return list[0], nil
	}
	return Record{}, nil
}

func (s *Store) QueryTime(recordId int, param QueryParam) ([]Time, error) {
	t := Time{}
	ml, err := s.query(t, t.getSearchBucket(recordId), param)
	if err != nil {
		return nil, err
	}
	tl, err := fromMapList[Time](ml)
	return tl, err
}

func (s *Store) delete(id int, nested SearchBucketList) error {
	err := s.db.Update(func(tx *bbolt.Tx) error {
		bucket, err := getBucket(tx, nested)
		if err != nil {
			return err
		}
		err = bucket.Delete(intToByte(id))
		if isDev {
			serialize(tx)
		}
		return err
	})
	if err != nil {
		logger.Sugar().Errorw(err.Error(), "id", id, "nested", nested)
	}
	return err
}

func (s *Store) DeleteRecord(id int) error {
	r := Record{}
	err := s.delete(id, r.getSearchBucket())
	if err != nil {
		return err
	}
	err = s.db.Update(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(RECORD))
		name := combineKeyAndId(TIME, id)
		return bucket.DeleteBucket([]byte(name))
	})
	return err
}

func (s *Store) DeleteTimeN(recordId, id int) error {
	t := Time{}
	return s.delete(id, t.getSearchBucket(recordId))
}

func (s *Store) update(id int, data Map, nested SearchBucketList) error {
	err := s.db.Update(func(tx *bbolt.Tx) error {
		bucket, err := getBucket(tx, nested)
		if err != nil {
			return err
		}
		b := bucket.Get(intToByte(id))
		var instance Map
		err = json.Unmarshal(b, &instance)
		if err != nil {
			return err
		}
		for k := range instance {
			if v, ok := data[k]; ok && k != "id" {
				instance[k] = v
			}
		}
		b, _ = json.Marshal(instance)
		err = bucket.Put(intToByte(id), b)
		if isDev {
			serialize(tx)
		}
		return err
	})
	if err != nil {
		logger.Sugar().Errorw(err.Error(), "id", id, "data", data, "nested", nested)
	}
	return err
}

func (s *Store) UpdateRecord(id int, data Map) error {
	r := Record{}
	return s.update(id, data, r.getSearchBucket())
}

func (s *Store) UpdateTime(recordId, id int, data Map) error {
	t := Time{}
	return s.update(id, data, t.getSearchBucket(recordId))
}
