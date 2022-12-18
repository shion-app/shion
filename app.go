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
	recordList, err := a.QueryRecord(QueryParam{})
	if err == nil {
		SetExeWhiteList(recordList)
	}
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

func (a *App) CheckExecutablePath(exe string) (bool, error) {
	recordList, err := a.QueryRecord(QueryParam{})
	if err != nil {
		return false, err
	}
	return !lo.ContainsBy(recordList, func(record Record) bool {
		return record.Exe == exe
	}), nil
}

func (a *App) InsertRecord(name string, recordType int, exe string) (int, error) {
	id, err := a.store.InsertRecord(Map{
		"name": name,
		"type": recordType,
		"exe":  exe,
	})
	a.setExeWhiteList()
	return id, err
}

func (a *App) DeleteRecord(id int) error {
	record, err := a.store.QueryRecordById(id)
	if err != nil {
		return err
	}
	if record.isVaild() {
		DeleteProgramMap(record.Exe)
	}
	err = a.store.DeleteRecord(id)
	if err != nil {
		return err
	}
	a.setExeWhiteList()
	return nil
}

func (a *App) UpdateRecord(id int, params Map) error {
	if _, ok := params["exe"]; ok {
		record, err := a.store.QueryRecordById(id)
		if err != nil {
			return err
		}
		UpdateProgramMap(record.Exe)
	}
	err := a.store.UpdateRecord(id, params)
	if err != nil {
		return err
	}
	a.setExeWhiteList()
	return nil
}

func (a *App) QueryRecord(param QueryParam) ([]Record, error) {
	return a.store.QueryRecord(param)
}

func (a *App) InsertTime(recordId int, labelId int, start int, end int) (int, error) {
	return a.store.InsertTime(recordId, Map{
		"label": labelId,
		"start": start,
		"end":   end,
	})
}

func (a *App) QueryTime(recordId int, param QueryParam) ([]Time, error) {
	return a.store.QueryTime(recordId, param)
}

func (a *App) UpdateTime(recordId int, id int, params Map) error {
	return a.store.UpdateTime(recordId, id, params)
}

func (a *App) InsertLabel(recordId int, name string) (int, error) {
	return a.store.InsertLabel(recordId, Map{
		"name": name,
	})
}

func (a *App) QueryLabel(recordId int, param QueryParam) ([]Label, error) {
	return a.store.QueryLabel(recordId, param)
}
