package main

import (
	"time"
	"unsafe"

	"github.com/samber/lo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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

const (
	EVENT_OBJECT_FOCUS          = 0x8005
	EVENT_OBJECT_LOCATIONCHANGE = 0x800B

	WINEVENT_OUTOFCONTEXT   = 0x0000
	WINEVENT_SKIPOWNTHREAD  = 0x0001
	WINEVENT_SKIPOWNPROCESS = 0x0002
	WINEVENT_INCONTEXT      = 0x0004
)

type WINEVENTPROC func(hWinEventHook HWINEVENTHOOK, event DWORD, hwnd HWND, idObject LONG, idChild LONG, idEventThread DWORD, dwmsEventTime DWORD) uintptr

type WNDPROC func(hWnd HWND, uMsg UINT, wParam WPARAM, lParam LPARAM) LRESULT

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

var exeWhiteList = []string{}

func setExeWhiteList(recordList []Record) {
	exeWhiteList = lo.Map(recordList, func(item Record, _ int) string {
		return item.Exe
	})
}

type Program struct {
	start int
	timer *time.Timer
}

var programMap = map[string]Program{}

var timeout = time.Minute * 2

func deleteProgramMap(exe string) {
	if program, ok := programMap[exe]; ok {
		program.timer.Stop()
		delete(programMap, exe)
	}
}

func updateProgramMap(exe string) {
	if program, ok := programMap[exe]; ok {
		program.timer.Stop()
		finish(exe)
	}
}

// TODO: 关机自动保存
func closeWatch() {
	activeExe := lo.Keys(programMap)
	lo.ForEach(activeExe, func(item string, _ int) {
		finish(item)
	})
	runtime.EventsEmit(app.ctx, "close-watch")
}

func getPathByPid(pid uint32) string {
	handle, _ := windows.OpenProcess(windows.PROCESS_QUERY_INFORMATION|windows.PROCESS_VM_READ, false, pid)
	size := uint32(windows.MAX_PATH)
	var buf = make([]uint16, size)
	windows.GetModuleFileNameEx(handle, 0, &buf[0], size)
	windows.CloseHandle(handle)
	return windows.UTF16ToString(buf)
}

func finish(exe string) {
	now := int(time.Now().UnixMilli())
	program := programMap[exe]
	recordList := app.QueryRecord()
	record, _ := lo.Find(recordList, func(item Record) bool {
		return item.Exe == exe
	})
	app.InsertTime(record.Id, program.start, now)
	delete(programMap, exe)
	app.setActiveExeList()
}

func generateProgram(exe string, timeout time.Duration) Program {
	mill := int(time.Now().UnixMilli())
	return Program{
		start: mill,
		timer: time.AfterFunc(timeout, func() {
			finish(exe)
		}),
	}
}

func handleEvent(event int, path string) {
	if _, ok := programMap[path]; !ok {
		programMap[path] = generateProgram(path, timeout)
	}
	switch event {
	case EVENT_OBJECT_FOCUS:
	case EVENT_OBJECT_LOCATIONCHANGE:
		program := programMap[path]
		program.timer.Reset(timeout)
		app.setActiveExeList()
	}
}

func watch() {
	setWinEventHook(EVENT_OBJECT_FOCUS, EVENT_OBJECT_LOCATIONCHANGE, 0, activeWinEventHook, 0, 0, WINEVENT_OUTOFCONTEXT|WINEVENT_SKIPOWNPROCESS)

	var msg MSG
	for m := getMessage(&msg, 0, 0, 0); m != 0; {
		translateMessage(&msg)
		dispatchMessage(&msg)
	}
	// unhookWinEvent(winEvHook)
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

// func windowProc(hwnd syscall.Handle, msg uint32, wparam, lparam uintptr) (rc uintptr) {
// 	switch msg {
// 	case WM_SIZE:
// 		if wparam == SIZE_MAXIMIZED || wparam == SIZE_RESTORED {
// 			// HERE, I use a channel to notify to the Go application
// 		}
// 	default:
// 		return DefWindowProc(hwnd, msg, wparam, lparam)
// 	}
// 	return 1
// }

// func unhookWinEvent(hWinEventHook HWINEVENTHOOK) bool {
// 	ret, _, _ := procUnhookWinEvent.Call(
// 		uintptr(hWinEventHook),
// 	)
// 	return ret != 0
// }

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
