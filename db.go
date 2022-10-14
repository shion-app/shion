package main

import (
	"encoding/binary"
	"encoding/json"
	"path/filepath"

	"go.etcd.io/bbolt"
)

var APP_INFO, TIME, TIME_LIST = "appInfo", "time", "listList"

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

type TimeItem struct {
	timeId     int
	Id         int   `json:"id"`
	Collection []int `json:"collection"`
}

func insertTimeItem(db *bbolt.DB, timeId int, collection []int) error {
	return db.Update(func(tx *bbolt.Tx) error {
		timeBucket := tx.Bucket([]byte(TIME))
		timeListBucket, _ := timeBucket.CreateBucketIfNotExists([]byte(TIME_LIST))
		id, _ := timeListBucket.NextSequence()
		instance := TimeItem{
			timeId:     timeId,
			Id:         int(id),
			Collection: collection,
		}
		data, _ := json.Marshal(instance)
		return timeBucket.Put(itob(instance.Id), data)
	})
}

func selectAllTimeItem(db *bbolt.DB, timeId int) []TimeItem {
	var result = make([]TimeItem, 0)
	db.View(func(tx *bbolt.Tx) error {
		timeBucket := tx.Bucket([]byte(TIME))
		timeListBucket, _ := timeBucket.CreateBucketIfNotExists([]byte(TIME_LIST))
		timeListBucket.ForEach(func(k, v []byte) error {
			var instance TimeItem
			json.Unmarshal(v, &instance)
			if instance.timeId == timeId {
				result = append(result, instance)
			}
			return nil
		})
		return nil
	})
	return result
}
