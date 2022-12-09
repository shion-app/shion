package main

import (
	"context"

	"github.com/samber/lo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx   context.Context
	store Store
}

func NewApp(store Store) *App {
	return &App{
		store: store,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) domReady(ctx context.Context) {
	a.setExeWhiteList()
}

func (a *App) shutdown(ctx context.Context) {
	CloseWatch()
}

func (a *App) setActiveExeList() {
	activeExe := lo.Keys(programMap)
	// bug https://github.com/wailsapp/wails/issues/699
	runtime.EventsEmit(a.ctx, "active-exe", activeExe)
}

func (a *App) setExeWhiteList() {
	recordList := a.store.QueryRecord()
	SetExeWhiteList(recordList)
}

// expose

func (a *App) GetActiveExeList() []string {
	return lo.Keys(programMap)
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
	a.store.InsertRecord(name, recordType, exe)
	a.setExeWhiteList()
}

func (a *App) DeleteRecord(id int) {
	record := a.store.QueryRecordById(id)
	DeleteProgramMap(record.Exe)
	a.store.DeleteRecord(id)
	a.setExeWhiteList()
}

func (a *App) UpdateRecord(id int, params Map) {
	if _, ok := params["exe"]; ok {
		record := a.store.QueryRecordById(id)
		UpdateProgramMap(record.Exe)
	}
	a.store.UpdateRecord(id, params)
	a.setExeWhiteList()
}

func (a *App) QueryRecord() []Record {
	return a.store.QueryRecord()
}

func (a *App) InsertTime(recordId int, start int, end int) int {
	return a.store.InsertTime(recordId, start, end)
}

func (a *App) QueryTime(recordId int) []Time {
	return a.store.QueryTime(recordId)
}

func (a *App) UpdateTime(recordId int, id int, params Map) {
	a.store.UpdateTime(recordId, id, params)
}
