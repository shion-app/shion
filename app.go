package main

import (
	"context"
	"encoding/json"

	"github.com/samber/lo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx   context.Context
	store Store
}

// NewApp creates a new App application struct
func NewApp(store Store) *App {
	return &App{
		store: store,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetExecutablePath() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Executable file",
				Pattern:     "*.exe",
			},
		},
	})
}

func (a *App) CheckExecutablePath(exe string) bool {
	recordList := a.QueryRecord()
	return !lo.ContainsBy(recordList, func(record Record) bool {
		return record.Exe == exe
	})
}

func (a *App) InsertRecord(name string, recordType int, exe string) {
	a.store.insertRecord(name, recordType, exe)
}

func (a *App) DeleteRecord(id int) {
	a.store.deleteRecord(id)
}

func (a *App) UpdateRecord(id int, raw json.RawMessage) {
	a.store.updateRecord(id, raw)
}

func (a *App) QueryRecord() []Record {
	return a.store.queryRecord()
}

func (a *App) InsertTime(recordId int, start int, end int) {
	a.store.insertTime(recordId, start, end)
}

func (a *App) QueryTime(recordId int) []Time {
	return a.store.queryTime(recordId)
}
