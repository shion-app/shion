package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"path/filepath"
	"reflect"

	"go.etcd.io/bbolt"
)

func itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
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
		return nil
	})
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
		return recordBucket.Put(itob(instance.Id), data)
	})
}

func (store *Store) deleteRecord(id int) {
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		recordBucket.Delete(itob(id))
		recordBucket.Delete([]byte(combineKeyAndId(TIME, id)))
		return nil
	})
}

func (store *Store) updateRecord(id int, params map[string]any) {
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		data := recordBucket.Get(itob(id))
		var instance Record
		json.Unmarshal(data, &instance)
		assign(&instance, params)
		data, _ = json.Marshal(instance)
		return recordBucket.Put(itob(instance.Id), data)
	})
}

func assign(target any, value map[string]any) {
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
		data := recordBucket.Get(itob(id))
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
		recordBucket.Put(itob(recordInstance.Id), recordData)

		timeBucket := recordBucket.Bucket([]byte(combineKeyAndId(TIME, recordId)))
		id, _ = timeBucket.NextSequence()
		timeInstance := Time{
			Id:    int(id),
			Start: start,
			End:   end,
		}
		timeData, _ := json.Marshal(timeInstance)
		return timeBucket.Put(itob(timeInstance.Id), timeData)
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

func (store *Store) updateTime(recordId int, id int, params map[string]any) {
	store.db.Update(func(tx *bbolt.Tx) error {
		recordBucket := tx.Bucket([]byte(RECORD))
		timeBucket := recordBucket.Bucket([]byte(combineKeyAndId(TIME, recordId)))
		data := timeBucket.Get(itob(id))
		var instance Time
		json.Unmarshal(data, &instance)
		assign(&instance, params)
		data, _ = json.Marshal(instance)
		return timeBucket.Put(itob(instance.Id), data)
	})
}
