package main

import (
	"context"
	"fmt"

	"github.com/samber/lo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) domReady(ctx context.Context) {
	a.setExeWhiteList()
	needUpgrade, tagName, asset, err := CheckUpgrade()
	if err != nil {
		logger.Error(err.Error())
		return
	}
	if needUpgrade && len(asset.Url) != 0 {
		runtime.EventsEmit(a.ctx, "can-upgrade", tagName)
		runtime.EventsOnce(a.ctx, "upgrade", func(optionalData ...interface{}) {
			Upgrade(asset)
		})
	}
}

func (a *App) shutdown(ctx context.Context) {
	CloseWatch()
}

func (a *App) setActiveExeList() {
	activeExe := lo.Keys(programMap)
	// BUG: https://github.com/wailsapp/wails/issues/699
	runtime.EventsEmit(a.ctx, "active-exe", activeExe)
}

func (a *App) setExeWhiteList() {
	recordList, err := a.QueryAllRecord()
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
	recordList, err := a.QueryAllRecord()
	if err != nil {
		return false, err
	}
	return !lo.ContainsBy(recordList, func(record Record) bool {
		return record.Exe == exe
	}), nil
}

func (a *App) InsertRecord(name string, recordType int, exe string) (uint, error) {
	id, err := Create(Record{
		Name: name,
		Type: recordType,
		Exe:  exe,
	})
	a.setExeWhiteList()
	return id, err
}

func (a *App) DeleteRecord(id uint) error {
	record, err := FindByID[Record](id)
	if err != nil {
		return err
	}
	DeleteProgramMap(record.Exe)
	err = Delete[Record](id)
	if err != nil {
		return err
	}
	a.setExeWhiteList()
	return nil
}

func (a *App) UpdateRecord(id uint, data Map) error {
	delete(data, "type")
	if _, ok := data["exe"]; ok {
		record, err := FindByID[Record](id)
		if err != nil {
			return err
		}
		UpdateProgramMap(record.Exe)
	}
	r := Record{}
	r.ID = id
	err := Update(r, data)
	if err != nil {
		return err
	}
	a.setExeWhiteList()
	return nil
}

func (a *App) QueryAllRecord() (list []Record, err error) {
	err = db.Select("records.*", "IFNULL(SUM(times.[end] - times.start), 0) total_time").Joins("LEFT JOIN times ON records.id = times.record_id").Group("records.id").Find(&list).Error
	return
}

func (a *App) InsertTime(recordId uint, labelIdList []uint, start int, end int) (uint, error) {
	time := Time{
		Start:    start,
		End:      end,
		RecordID: recordId,
	}
	id, err := Create(time)
	time.ID = id
	if err != nil {
		return id, err
	}
	for _, v := range labelIdList {
		label, err := FindByID[Label](v)
		if err != nil {
			return id, err
		}
		err = db.Model(&time).Association("Labels").Append(&label)
		if err != nil {
			return id, err
		}
	}
	return id, err
}

func (a *App) QueryAllTime(recordId uint, start int, end int) ([]Time, error) {
	return FindAll[Time](lo.T3("record_id", "=", fmt.Sprint(recordId)), lo.T3("start", ">=", fmt.Sprint(start)), lo.T3("end", "<=", fmt.Sprint(end)))
}

func (a *App) UpdateTime(id uint, data Map) error {
	t := Time{}
	t.ID = id
	return Update(t, data)
}

func (a *App) InsertLabel(recordId uint, name string) (uint, error) {
	return Create(Label{
		Name:     name,
		RecordID: recordId,
	})
}

func (a *App) QueryAllLabelByRecordID(recordId uint) (list []Label, err error) {
	err = db.Select("labels.*", "IFNULL(SUM(times.[end] - times.start), 0) total_time").Joins("LEFT JOIN times ON labels.record_id = times.record_id").Group("labels.id").Find(&list).Error
	return
}

type WithTimeIDLabel struct {
	TimeID uint    `json:"timeID"`
	Labels []Label `json:"labels"`
}

func (a *App) QueryAllLabelByTimeIDList(idList []uint) (list []WithTimeIDLabel, err error) {
	list = []WithTimeIDLabel{}
	for _, v := range idList {
		labels := []Label{}
		err = db.Table("time_labels").Select("labels.*", "IFNULL(SUM(times.[end] - times.start), 0) total_time").Joins("LEFT JOIN times ON time_labels.time_id = times.id").Joins("LEFT JOIN labels ON time_labels.label_id = labels.id").Where("times.id = ?", v).Group("labels.id").Scan(&labels).Error
		if err != nil {
			return []WithTimeIDLabel{}, err
		}
		list = append(list, WithTimeIDLabel{
			TimeID: v,
			Labels: labels,
		})
	}
	return
}

func (a *App) UpdateLabel(id uint, data Map) error {
	l := Label{}
	l.ID = id
	return Update(l, data)
}
