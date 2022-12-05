package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"

	"github.com/samber/lo"
	"go.etcd.io/bbolt"
)

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

var (
	APP_INFO = "appInfo"
	TIME     = "time"
	RECORD   = "record"
)

type Store struct {
	db *bbolt.DB
}

type Map = map[string]any

func initStore(dir string) Store {
	db, _ := bbolt.Open(filepath.Join(dir, "data.db"), 0666, nil)
	store := Store{db: db}
	store.initDatabase()
	return store
}

func (store *Store) initDatabase() {
	store.db.Update(func(tx *bbolt.Tx) error {
		tx.CreateBucketIfNotExists([]byte(APP_INFO))
		tx.CreateBucketIfNotExists([]byte(RECORD))
		updateDatabase(tx)
		// serialize(tx)
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
	dir := getAppConfigDir()
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
	dir := getAppConfigDir()
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

const (
	RECORD_TYPE_MANUAL = 0
	RECORD_TYPE_AUTO   = 1
)

type Record struct {
	Id        int    `json:"id"`
	Name      string `json:"name"`
	Type      int    `json:"type"`
	Exe       string `json:"exe"`
	TotalTime int    `json:"totalTime"`
}

func (store *Store) insertRecord(name string, recordType int, exe string) {
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		id, _ := recordBucket.NextSequence()
		recordBucket.CreateBucket([]byte(combineKeyAndId(TIME, int(id))))
		instance := Record{
			Id:        int(id),
			Name:      name,
			Type:      recordType,
			Exe:       exe,
			TotalTime: 0,
		}
		data, _ := json.Marshal(instance)
		return recordBucket.Put(intToByte(instance.Id), data)
	})
}

func (store *Store) deleteRecord(id int) {
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		recordBucket.Delete(intToByte(id))
		recordBucket.DeleteBucket([]byte(combineKeyAndId(TIME, id)))
		return nil
	})
}

func (store *Store) updateRecord(id int, params Map) {
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		data := recordBucket.Get(intToByte(id))
		var instance Record
		json.Unmarshal(data, &instance)
		assign(&instance, params)
		data, _ = json.Marshal(instance)
		return recordBucket.Put(intToByte(instance.Id), data)
	})
}

func assign(target any, value Map) {
	targetReflect := reflect.ValueOf(target).Elem()
	targetType := targetReflect.Type()

	for i := 0; i < targetType.NumField(); i++ {
		field := targetType.Field(i)
		if !targetReflect.Field(i).CanSet() {
			continue
		}
		if val, ok := value[field.Tag.Get("json")]; ok {
			v := reflect.ValueOf(val)
			targetKind := targetReflect.Field(i).Kind()
			if targetKind == v.Kind() {
				targetReflect.Field(i).Set(v)
			} else if v.Kind() == reflect.Float64 {
				if targetKind == reflect.Int {
					targetReflect.Field(i).Set(reflect.ValueOf(int(v.Float())))
				}
			}
		}
	}
}

func (store *Store) queryRecord() []Record {
	result := []Record{}
	store.db.View(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		recordBucket.ForEach(func(k, v []byte) error {
			if !bytes.HasPrefix(k, []byte(TIME)) {
				var instance Record
				json.Unmarshal(v, &instance)
				result = append(result, instance)
			}
			return nil
		})
		return nil
	})
	return result
}

func (store *Store) queryRecordById(id int) Record {
	var instance Record
	store.db.View(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		data := recordBucket.Get(intToByte(id))
		json.Unmarshal(data, &instance)
		return nil
	})
	return instance
}

type Time struct {
	Id    int `json:"id"`
	Start int `json:"start"`
	End   int `json:"end"`
}

func (store *Store) insertTime(recordId int, start int, end int) int {
	var id uint64
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		recordInstance := store.queryRecordById(recordId)
		recordInstance.TotalTime += end - start
		recordData, _ := json.Marshal(recordInstance)
		recordBucket.Put(intToByte(recordInstance.Id), recordData)

		timeBucket := recordBucket.Bucket([]byte(combineKeyAndId(TIME, recordId)))
		id, _ = timeBucket.NextSequence()
		timeInstance := Time{
			Id:    int(id),
			Start: start,
			End:   end,
		}
		timeData, _ := json.Marshal(timeInstance)
		return timeBucket.Put(intToByte(timeInstance.Id), timeData)
	})
	return int(id)
}

func (store *Store) queryTime(recordId int) []Time {
	result := []Time{}
	store.db.View(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		timeBucket := recordBucket.Bucket([]byte(combineKeyAndId(TIME, recordId)))
		timeBucket.ForEach(func(k, v []byte) error {
			var instance Time
			json.Unmarshal(v, &instance)
			result = append(result, instance)
			return nil
		})
		return nil
	})
	return result
}

func (store *Store) updateTime(recordId int, id int, params Map) {
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		timeBucket := recordBucket.Bucket([]byte(combineKeyAndId(TIME, recordId)))
		data := timeBucket.Get(intToByte(id))
		var instance Time
		json.Unmarshal(data, &instance)
		oldEnd := instance.End
		assign(&instance, params)
		data, _ = json.Marshal(instance)
		if _, ok := params["end"]; ok {
			recordInstance := store.queryRecordById(recordId)
			recordInstance.TotalTime += instance.End - oldEnd
			recordData, _ := json.Marshal(recordInstance)
			recordBucket.Put(intToByte(recordInstance.Id), recordData)
		}
		return timeBucket.Put(intToByte(instance.Id), data)
	})
}
