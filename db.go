package main

import (
	"path/filepath"
	"time"

	"github.com/samber/lo"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Map = map[string]any

type OrmModel struct {
	ID        uint `gorm:"primarykey" json:"id"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type Model interface {
	GetID() uint
}

type Record struct {
	OrmModel
	Name      string `json:"name"`
	Type      int    `json:"type"`
	Exe       string `json:"exe"`
	TotalTime int    `json:"totalTime"`
}

func (r Record) GetID() uint {
	return r.ID
}

type Time struct {
	OrmModel
	Start    int     `json:"start"`
	End      int     `json:"end"`
	RecordID uint    `json:"recordID"`
	Labels   []Label `gorm:"many2many:time_labels;"`
}

func (t Time) GetID() uint {
	return t.ID
}

type Label struct {
	OrmModel
	Name      string `json:"name"`
	RecordID  uint   `json:"recordID"`
	TotalTime int    `json:"totalTime"`
}

func (l Label) GetID() uint {
	return l.ID
}

func InitDatabase() *gorm.DB {
	dir := GetAppConfigDir()
	dbPath := filepath.Join(dir, "data.db")
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		logger.Error(err.Error())
	}
	db.AutoMigrate(&Record{}, &Time{}, &Label{})
	return db
}

func Create[M Model](m M) (uint, error) {
	err := db.Create(&m).Error
	return m.GetID(), err
}

func FindAll[M Model](params ...lo.Tuple3[string, string, string]) ([]M, error) {
	var list []M
	err := db.Where(composite(params...)).Find(&list).Error
	return list, err
}

func Find[M Model](params ...lo.Tuple3[string, string, string]) (M, error) {
	var m M
	err := db.Where(composite(params...)).First(&m).Error
	return m, err
}

func FindByID[M Model](id uint) (M, error) {
	var m M
	err := db.First(&m, id).Error
	return m, err
}

func Delete[M Model](id uint) error {
	var m M
	err := db.Delete(&m, id).Error
	return err
}

func Update[M Model](m M, data Map) error {
	err := db.Model(&m).Updates(data).Error
	return err
}

func composite(values ...lo.Tuple3[string, string, string]) string {
	str := ""
	for _, v := range values {
		name, condition, value := v.A, v.B, v.C
		exp := name + condition + value
		if len(str) > 0 {
			exp = "AND" + exp
		}
		str += exp
	}
	return str
}
