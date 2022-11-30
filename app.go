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

func (a *App) domReady(ctx context.Context) {
	a.setExeWhiteList()
}

func (a *App) shutdown(ctx context.Context) {
	closeWatch()
}

func (a *App) setActiveExeList() {
	activeExe := lo.Keys(programMap)
	// bug https://github.com/wailsapp/wails/issues/699
	runtime.EventsEmit(a.ctx, "active-exe", activeExe)
}

func (a *App) GetActiveExeList() []string {
	return lo.Keys(programMap)
}

func (a *App) setExeWhiteList() {
	recordList := a.store.queryRecord()
	setExeWhiteList(recordList)
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
	a.setExeWhiteList()
}

func (a *App) DeleteRecord(id int) {
	record := a.store.queryRecordById(id)
	deleteProgramMap(record.Exe)
	a.store.deleteRecord(id)
	a.setExeWhiteList()
}

func (a *App) UpdateRecord(id int, raw json.RawMessage) {
	var params map[string]any
	json.Unmarshal(raw, &params)
	if _, ok := params["exe"]; ok {
		record := a.store.queryRecordById(id)
		updateProgramMap(record.Exe)
	}
	a.store.updateRecord(id, params)
	a.setExeWhiteList()
}

func (a *App) QueryRecord() []Record {
	return a.store.queryRecord()
}

func (a *App) InsertTime(recordId int, start int, end int) int {
	return a.store.insertTime(recordId, start, end)
}

func (a *App) QueryTime(recordId int) []Time {
	return a.store.queryTime(recordId)
}

func (a *App) UpdateTime(recordId int, id int, raw json.RawMessage) {
	var params map[string]any
	json.Unmarshal(raw, &params)
	a.store.updateTime(recordId, id, params)
}
