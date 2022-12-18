package main

import (
	"time"
	"unsafe"

	"github.com/samber/lo"
	"golang.org/x/sys/windows"
)

type (
	HANDLE        uintptr
	HMODULE       HANDLE
	HWINEVENTHOOK HANDLE
	HWND          HANDLE
	WPARAM        uintptr
	LPARAM        uintptr
	LRESULT       uintptr
	DWORD         uint32
	UINT          uint32
	LONG          int32
	INT           int
)

type POINT struct {
	X, Y int32
}

type MSG struct {
	Hwnd    HWND
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      POINT
}

type WINEVENTPROC func(hWinEventHook HWINEVENTHOOK, event DWORD, hwnd HWND, idObject LONG, idChild LONG, idEventThread DWORD, dwmsEventTime DWORD) uintptr

type WNDPROC func(hWnd HWND, uMsg UINT, wParam WPARAM, lParam LPARAM) LRESULT

type Program struct {
	recordId int
	timeId   int
	timer    *time.Timer
}

const (
	EVENT_OBJECT_FOCUS          = 0x8005
	EVENT_OBJECT_LOCATIONCHANGE = 0x800B

	WINEVENT_OUTOFCONTEXT   = 0x0000
	WINEVENT_SKIPOWNTHREAD  = 0x0001
	WINEVENT_SKIPOWNPROCESS = 0x0002
	WINEVENT_INCONTEXT      = 0x0004
)

var (
	user32 = windows.NewLazyDLL("user32.dll")

	procSetWinEventHook = user32.NewProc("SetWinEventHook")
	// procUnhookWinEvent   = user32.NewProc("UnhookWinEvent")
	procGetMessage       = user32.NewProc("GetMessageW")
	procTranslateMessage = user32.NewProc("TranslateMessage")
	procDispatchMessage  = user32.NewProc("DispatchMessageW")
	// procPostQuitMessage  = user32.NewProc("PostQuitMessage")

	activeWinEventHook WINEVENTPROC = func(hWinEventHook HWINEVENTHOOK, event DWORD, hwnd HWND, idObject LONG, idChild LONG, idEventThread DWORD, dwmsEventTime DWORD) uintptr {
		var pid uint32
		windows.GetWindowThreadProcessId(windows.HWND(hwnd), &pid)
		exe := getPathByPid(pid)
		valid := lo.ContainsBy(exeWhiteList, func(item string) bool {
			return item == exe
		})
		if valid {
			handleEvent(int(event), exe)
		}
		return uintptr(0)
	}
)

var (
	exeWhiteList = []string{}
	programMap   = map[string]Program{}
	timeout      = time.Minute * 2
)

func SetExeWhiteList(recordList []Record) {
	exeWhiteList = lo.FilterMap(recordList, func(item Record, _ int) (string, bool) {
		return item.Exe, len(item.Exe) > 0
	})
}

func DeleteProgramMap(exe string) {
	if program, ok := programMap[exe]; ok {
		program.timer.Stop()
		delete(programMap, exe)
	}
}

func UpdateProgramMap(exe string) {
	if program, ok := programMap[exe]; ok {
		program.timer.Stop()
		finish(exe)
	}
}

func CloseWatch() {
	activeExe := lo.Keys(programMap)
	lo.ForEach(activeExe, func(item string, _ int) {
		finish(item)
	})
}

func getPathByPid(pid uint32) string {
	handle, _ := windows.OpenProcess(windows.PROCESS_QUERY_INFORMATION|windows.PROCESS_VM_READ, false, pid)
	size := uint32(windows.MAX_PATH)
	var buf = make([]uint16, size)
	windows.GetModuleFileNameEx(handle, 0, &buf[0], size)
	windows.CloseHandle(handle)
	return windows.UTF16ToString(buf)
}

func update(exe string) {
	now := int(time.Now().UnixMilli())
	program := programMap[exe]
	app.UpdateTime(program.recordId, program.timeId, map[string]any{
		"end": now,
	})
}

func finish(exe string) {
	update(exe)
	delete(programMap, exe)
	app.setActiveExeList()
}

func generateProgram(recordId int, timeId int, exe string, timeout time.Duration) Program {
	return Program{
		recordId: recordId,
		timeId:   timeId,
		timer: time.AfterFunc(timeout, func() {
			finish(exe)
		}),
	}
}

func handleEvent(event int, path string) {
	if _, ok := programMap[path]; !ok {
		recordList, err := app.QueryRecord(QueryParam{})
		if err != nil {
			return
		}
		record, _ := lo.Find(recordList, func(item Record) bool {
			return item.Exe == path
		})
		milli := int(time.Now().UnixMilli())
		timeId, err := app.InsertTime(record.Id, 0, milli, milli)
		if err != nil {
			return
		}
		programMap[path] = generateProgram(record.Id, timeId, path, timeout)
	}
	switch event {
	case EVENT_OBJECT_FOCUS:
	case EVENT_OBJECT_LOCATIONCHANGE:
		program := programMap[path]
		program.timer.Reset(timeout)
		app.setActiveExeList()
	}
}

func tickUpdate() {
	ticker := time.NewTicker(time.Minute)
	go func() {
		for {
			<-ticker.C
			activeExe := lo.Keys(programMap)
			lo.ForEach(activeExe, func(item string, _ int) {
				update(item)
			})
		}
	}()
}

func Watch() {
	go (func() {
		tickUpdate()
		setWinEventHook(EVENT_OBJECT_FOCUS, EVENT_OBJECT_LOCATIONCHANGE, 0, activeWinEventHook, 0, 0, WINEVENT_OUTOFCONTEXT|WINEVENT_SKIPOWNPROCESS)

		var msg MSG
		for m := getMessage(&msg, 0, 0, 0); m != 0; {
			translateMessage(&msg)
			dispatchMessage(&msg)
		}
		// unhookWinEvent(winEvHook)
	})()
}

func setWinEventHook(eventMin DWORD, eventMax DWORD, hmodWinEventProc HMODULE, pfnWinEventProc WINEVENTPROC, idProcess DWORD, idThread DWORD, dwFlags DWORD) HWINEVENTHOOK {
	pfnWinEventProcCallback := windows.NewCallback(pfnWinEventProc)
	ret, _, _ := procSetWinEventHook.Call(
		uintptr(eventMin),
		uintptr(eventMax),
		uintptr(hmodWinEventProc),
		pfnWinEventProcCallback,
		uintptr(idProcess),
		uintptr(idThread),
		uintptr(dwFlags),
	)
	return HWINEVENTHOOK(ret)
}

func getMessage(msg *MSG, hwnd HWND, msgFilterMin UINT, msgFilterMax UINT) int {
	ret, _, _ := procGetMessage.Call(
		uintptr(unsafe.Pointer(msg)),
		uintptr(hwnd),
		uintptr(msgFilterMin),
		uintptr(msgFilterMax))

	return int(ret)
}

func translateMessage(msg *MSG) bool {
	ret, _, _ := procTranslateMessage.Call(
		uintptr(unsafe.Pointer(msg)))
	return ret != 0
}

func dispatchMessage(msg *MSG) uintptr {
	ret, _, _ := procDispatchMessage.Call(
		uintptr(unsafe.Pointer(msg)))
	return ret
}

// func postQuitMessage(exitCode INT) uintptr {
// 	ret, _, _ := procPostQuitMessage.Call(
// 		uintptr(exitCode))
// 	return ret
// }
