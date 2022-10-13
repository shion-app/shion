package main

import (
	"path/filepath"

	"go.etcd.io/bbolt"
)

func openDatabase(dir string) (*bbolt.DB, error) {
	return bbolt.Open(filepath.Join(dir, "data.db"), 0666, nil)
}
