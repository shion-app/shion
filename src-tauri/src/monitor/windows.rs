use std::cell::RefCell;
use std::ffi::OsStr;
use std::iter::once;
use std::mem;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::ptr;
use std::ptr::null_mut;
use std::thread;

use winapi::shared::minwindef::DWORD;
use winapi::shared::minwindef::LPCVOID;
use winapi::shared::minwindef::LPVOID;
use winapi::shared::minwindef::MAX_PATH;
use winapi::shared::minwindef::WORD;
use winapi::shared::ntdef::LONG;
use winapi::shared::windef::HWND;
use winapi::um::handleapi::CloseHandle;
use winapi::um::processthreadsapi::OpenProcess;
use winapi::um::psapi::{EnumProcessModulesEx, GetModuleFileNameExW};
use winapi::um::winnt::PROCESS_QUERY_INFORMATION;
use winapi::um::winnt::PROCESS_VM_READ;
use winapi::um::winuser::GetMessageW;
use winapi::um::winuser::GetWindowThreadProcessId;
use winapi::um::winuser::EVENT_OBJECT_NAMECHANGE;
use winapi::um::winuser::EVENT_SYSTEM_FOREGROUND;
use winapi::um::winuser::MSG;
use winapi::um::winuser::OBJID_WINDOW;
use winapi::um::winuser::{CallNextHookEx, SetWindowsHookExW, WH_KEYBOARD_LL, WH_MOUSE_LL};
use winapi::um::winuser::{
    DispatchMessageW, GetWindowTextLengthW, GetWindowTextW, SetWinEventHook, TranslateMessage,
    UnhookWinEvent, WINEVENT_OUTOFCONTEXT, WINEVENT_SKIPOWNPROCESS,
};
use winapi::um::winver::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW};

use super::shared::{Program, WatchOption};

thread_local! {
    static WINDOW: RefCell<Option<Box<dyn Fn(Program) -> ()>>> = RefCell::new(None);
    static MOUSE: RefCell<Option<Box<dyn Fn() -> ()>>> = RefCell::new(None);
    static KEYBOARD: RefCell<Option<Box<dyn Fn() -> ()>>> = RefCell::new(None);
}

unsafe extern "system" fn mouse_hook_callback(
    n_code: i32,
    w_param: usize,
    l_param: isize,
) -> isize {
    if n_code >= 0 {
        MOUSE.with(|i| {
            if let Some(f) = &*i.borrow() {
                f();
            }
        });
    }
    CallNextHookEx(null_mut(), n_code, w_param, l_param)
}

unsafe extern "system" fn keyboard_hook_callback(
    n_code: i32,
    w_param: usize,
    l_param: isize,
) -> isize {
    if n_code >= 0 {
        KEYBOARD.with(|i| {
            if let Some(f) = &*i.borrow() {
                f();
            }
        });
    }
    CallNextHookEx(null_mut(), n_code, w_param, l_param)
}

unsafe extern "system" fn handle_event(
    _: winapi::shared::windef::HWINEVENTHOOK,
    event: DWORD,
    hwnd: HWND,
    id_object: LONG,
    _: LONG,
    _: DWORD,
    _: DWORD,
) {
    let is_switch_window = event == EVENT_SYSTEM_FOREGROUND;
    let is_title_change = event == EVENT_OBJECT_NAMECHANGE && id_object == OBJID_WINDOW;

    let ok = vec![is_switch_window, is_title_change]
        .into_iter()
        .any(|x| x);

    if !ok {
        return;
    }
    let title = get_application_title(hwnd);

    if title.is_none() {
        return;
    }

    let title = title.unwrap();

    let application_path = get_application_path(hwnd);

    if application_path.is_none() {
        return;
    }

    let path = application_path.unwrap();

    let description = get_application_description(path.clone());
    let description =  if description.is_some() && description.clone().unwrap().len() != 0 {
        description.unwrap()
    } else {
        let file_stem = Path::new(&path).file_stem().unwrap().to_str().unwrap();
        file_stem.to_string()
    };
    let program = Program { path, description, title };

    WINDOW.with(|i| {
        if let Some(f) = &*i.borrow() {
            f(program);
        }
    });
}

fn to_u16(str: String) -> Vec<u16> {
    OsStr::new(&str).encode_wide().chain(once(0)).collect()
}

fn get_application_title(hwnd: HWND) -> Option<String> {
    let len = unsafe { GetWindowTextLengthW(hwnd) };
    if len == 0 {
        return None;
    }
    println!("{}", len);
    let mut title: Vec<u16> = vec![0; len as usize + 1];
    let ret = unsafe { GetWindowTextW(hwnd, title.as_mut_ptr(), len + 1) };
    if ret == 0 {
        return None;
    }
    Some(String::from_utf16_lossy(&title))
}

fn get_application_path(hwnd: HWND) -> Option<String> {
    let mut process_id = 0;
    let result = unsafe { GetWindowThreadProcessId(hwnd, &mut process_id) };
    if result == 0 {
        return None;
    }
    let process_handle =
        unsafe { OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, process_id) };

    if process_handle.is_null() {
        return None;
    }
    let mut h_mod = null_mut();
    let mut cb_needed = 0;
    let result = unsafe {
        EnumProcessModulesEx(
            process_handle,
            &mut h_mod,
            std::mem::size_of_val(&h_mod) as u32,
            &mut cb_needed,
            0x03,
        )
    };
    if result == 0 {
        return None;
    }
    let mut path: [u16; MAX_PATH] = [0u16; MAX_PATH];
    let len = unsafe {
        GetModuleFileNameExW(process_handle, h_mod, path.as_mut_ptr(), path.len() as u32)
    } as usize;
    if len == 0 {
        return None;
    }
    let result = unsafe { CloseHandle(process_handle) };
    if result == 0 {
        return None;
    }
    Some(String::from_utf16_lossy(&path[..len]))
}

fn get_application_description(application_path: String) -> Option<String> {
    let application_path = to_u16(application_path);

    let mut handle = 0;
    let size = unsafe { GetFileVersionInfoSizeW(application_path.as_ptr(), &mut handle) };
    if size == 0 {
        return None;
    }

    let mut data = vec![0u8; size as usize];
    let result = unsafe {
        GetFileVersionInfoW(
            application_path.as_ptr(),
            handle,
            size,
            data.as_mut_ptr() as LPVOID,
        )
    };
    if result == 0 {
        return None;
    }

    #[repr(C)]
    struct LANGANDCODEPAGE {
        language: WORD,
        codepage: WORD,
    }

    let mut value_ptr: LPVOID = ptr::null_mut();
    let mut value_size: DWORD = 0;
    let result = unsafe {
        VerQueryValueW(
            data.as_ptr() as LPCVOID,
            to_u16("\\VarFileInfo\\Translation".to_string()).as_ptr(),
            &mut value_ptr,
            &mut value_size,
        )
    };
    if result == 0 || value_size == 0 {
        return None;
    }
    let codepage = value_ptr as *const LANGANDCODEPAGE;
    let translation_key = unsafe {
        format!(
            "\\StringFileInfo\\{:04X}{:04X}",
            (*codepage).language,
            (*codepage).codepage
        )
    };

    let mut value_ptr: LPVOID = ptr::null_mut();
    let mut value_size: DWORD = 0;
    let result = unsafe {
        VerQueryValueW(
            data.as_ptr() as LPVOID,
            to_u16(format!("{}\\FileDescription", translation_key).to_string()).as_ptr(),
            &mut value_ptr,
            &mut value_size,
        )
    };
    if result == 0 || value_size == 0 {
        return None;
    }
    let value_ptr = value_ptr as *const u16;
    let description: Vec<u16> =
        unsafe { std::slice::from_raw_parts(value_ptr, (value_size - 1) as usize).to_vec() };
    Some(String::from_utf16_lossy(&description))
}

fn watch_input(option: WatchOption) {
    let WatchOption {
        window,
        mouse,
        keyboard,
    } = option;

    WINDOW.with(|f| *f.borrow_mut() = Some(Box::new(window)));
    MOUSE.with(|f| *f.borrow_mut() = Some(Box::new(mouse)));
    KEYBOARD.with(|f| *f.borrow_mut() = Some(Box::new(keyboard)));

    let hook = unsafe {
        SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_OBJECT_NAMECHANGE,
            ptr::null_mut(),
            Some(handle_event),
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS,
        )
    };
    if hook.is_null() {
        return;
    }

    let mouse_hook =
        unsafe { SetWindowsHookExW(WH_MOUSE_LL, Some(mouse_hook_callback), null_mut(), 0) };
    if mouse_hook.is_null() {
        return;
    }

    let keyboard_hook =
        unsafe { SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_hook_callback), null_mut(), 0) };
    if keyboard_hook.is_null() {
        return;
    }

    unsafe {
        let mut msg: MSG = mem::zeroed();
        loop {
            let ret = GetMessageW(&mut msg, ptr::null_mut(), 0, 0);
            if ret == 0 {
                break;
            }
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
            CallNextHookEx(null_mut(), 0, 0, 0);
        }
    }

    unsafe { UnhookWinEvent(hook) };
}

pub fn run(option: WatchOption) {
    let handle1 = thread::spawn(|| {
        watch_input(option);
    });

    handle1.join().unwrap();
}
