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

var whiteExeList = []string{}

type WINEVENTPROC func(hWinEventHook HWINEVENTHOOK, event DWORD, hwnd HWND, idObject LONG, idChild LONG, idEventThread DWORD, dwmsEventTime DWORD) uintptr

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
		valid := lo.ContainsBy(whiteExeList, func(item string) bool {
			return item == exe
		})
		if valid {
			handle(int(event), exe)
		}
		return uintptr(0)
	}
)

type Program struct {
	path  string
	start int64
	timer *time.Timer
}

var programMap = map[string]Program{}

func getPathByPid(pid uint32) string {
	handle, _ := windows.OpenProcess(windows.PROCESS_QUERY_INFORMATION|windows.PROCESS_VM_READ, false, pid)
	size := uint32(windows.MAX_PATH)
	var buf = make([]uint16, size)
	windows.GetModuleFileNameEx(handle, 0, &buf[0], size)
	windows.CloseHandle(handle)
	return windows.UTF16ToString(buf)
}

func handle(event int, path string) {
	_, ok := programMap[path]
	if !ok {
		mill := time.Now().UnixMilli()
		println(path)
		programMap[path] = Program{
			path:  path,
			start: mill,
			timer: time.AfterFunc(time.Second*5, func() {
				println("end")
				now := time.Now().UnixMilli()
				program := programMap[path]
				// total := now - program.start
				// TODO: 传递给wails
				delete(programMap, path)
				println("start", program.start, "end", now)
			}),
		}
	}
	switch event {
	case EVENT_OBJECT_FOCUS:
	case EVENT_OBJECT_LOCATIONCHANGE:
		println("active")
		program := programMap[path]
		program.timer.Reset(time.Second * 5)
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
