package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"path/filepath"

	"go.etcd.io/bbolt"
)

var APP_INFO = "appInfo"
var TIME = "time"
var TIME_LIST = "timeList"

func openDatabase(dir string) (*bbolt.DB, error) {
	return bbolt.Open(filepath.Join(dir, "data.db"), 0666, nil)
}

func initDatabase(db *bbolt.DB) error {
	return db.Update(func(tx *bbolt.Tx) error {
		tx.CreateBucketIfNotExists([]byte(APP_INFO))
		tx.CreateBucketIfNotExists([]byte(TIME))
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

func itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}

type Time struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
	// total int
}

func insertTime(db *bbolt.DB, name string) error {
	return db.Update(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(TIME))
		id, _ := bucket.NextSequence()
		instance := Time{
			Id:   int(id),
			Name: name,
		}
		data, _ := json.Marshal(instance)
		return bucket.Put(itob(instance.Id), data)
	})
}

func selectAllTime(db *bbolt.DB) []Time {
	var result = make([]Time, 0)
	db.View(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket([]byte(TIME))
		bucket.ForEach(func(k, v []byte) error {
			var instance Time
			json.Unmarshal(v, &instance)
			result = append(result, instance)
			return nil
		})
		return nil
	})
	return result
}

func deleteTime(db *bbolt.DB, id int) error {
	return db.Update(func(tx *bbolt.Tx) error {
		timeBucket := tx.Bucket([]byte(TIME))
		return timeBucket.Delete(itob(id))
	})
}

func updateTime(db *bbolt.DB, id int, name string) error {
	return db.Update(func(tx *bbolt.Tx) error {
		timeBucket := tx.Bucket([]byte(TIME))
		data := timeBucket.Get(itob(id))
		var newInstance Time
		json.Unmarshal(data, &newInstance)
		newInstance.Name = name
		data, _ = json.Marshal(newInstance)
		return timeBucket.Put(itob(id), data)
	})
}

type TimeItem struct {
	Id         int   `json:"id"`
	Collection []int `json:"collection"`
}

func insertTimeItem(db *bbolt.DB, timeId int, collection []int) error {
	return db.Update(func(tx *bbolt.Tx) error {
		timeBucket := tx.Bucket([]byte(TIME))
		timeListBucket, _ := timeBucket.CreateBucketIfNotExists([]byte(fmt.Sprintf("%s%d", TIME_LIST, timeId)))
		id, _ := timeListBucket.NextSequence()
		instance := TimeItem{
			Id:         int(id),
			Collection: collection,
		}
		data, _ := json.Marshal(instance)
		return timeListBucket.Put(itob(instance.Id), data)
	})
}

func selectAllTimeItem(db *bbolt.DB, timeId int) []TimeItem {
	var result = make([]TimeItem, 0)
	db.View(func(tx *bbolt.Tx) error {
		timeBucket := tx.Bucket([]byte(TIME))
		timeListBucket := timeBucket.Bucket([]byte(fmt.Sprintf("%s%d", TIME_LIST, timeId)))
		timeListBucket.ForEach(func(k, v []byte) error {
			var instance TimeItem
			json.Unmarshal(v, &instance)
			result = append(result, instance)
			return nil
		})
		return nil
	})
	return result
}

func deleteTimeItem(db *bbolt.DB, timeId int, id int) error {
	return db.Update(func(tx *bbolt.Tx) error {
		timeBucket := tx.Bucket([]byte(TIME))
		timeListBucket := timeBucket.Bucket([]byte(fmt.Sprintf("%s%d", TIME_LIST, timeId)))
		return timeListBucket.Delete(itob(id))
	})
}
