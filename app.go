package main

import (
	"context"

	"go.etcd.io/bbolt"
)

// App struct
type App struct {
	ctx context.Context
	db  bbolt.DB
}

// NewApp creates a new App application struct
func NewApp(db *bbolt.DB) *App {
	return &App{
		db: *db,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) InsertTime(name string) {
	insertTime(&a.db, name)
}

func (a *App) SelectAllTime() []Time {
	return selectAllTime(&a.db)
}

func (a *App) DeleteTime(id int) {
	deleteTime(&a.db, id)
}
func (a *App) UpdateTime(id int, name string) {
	updateTime(&a.db, id, name)
}

func (a *App) InsertTimeItem(timeId int, collection []int) {
	insertTimeItem(&a.db, timeId, collection)
}

func (a *App) SelectAllTimeItem(timeId int) []TimeItem {
	return selectAllTimeItem(&a.db, timeId)
}

func (a *App) DeleteTimeItem(timeId int, id int) {
	deleteTimeItem(&a.db, timeId, id)
}
