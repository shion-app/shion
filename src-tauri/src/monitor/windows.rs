use std::ffi::OsStr;

use std::iter;
use std::iter::once;
use std::mem;
use std::os::windows::ffi::OsStrExt;

use std::path::Path;
use std::ptr;
use std::ptr::null_mut;
use std::thread;


use winapi::shared::basetsd::ULONG_PTR;
use winapi::shared::minwindef::DWORD;
use winapi::shared::minwindef::LPVOID;
use winapi::shared::minwindef::UINT;
use winapi::shared::ntdef::LONG;
use winapi::shared::windef::HWND;
use winapi::um::errhandlingapi::GetLastError;
use winapi::um::handleapi::CloseHandle;
use winapi::um::processthreadsapi::OpenProcess;
use winapi::um::winnls::GetUserDefaultUILanguage;
use winapi::um::winnt::PROCESS_QUERY_INFORMATION;
use winapi::um::winnt::PROCESS_VM_READ;
use winapi::um::winuser::EVENT_OBJECT_NAMECHANGE;
use winapi::um::winuser::EVENT_SYSTEM_FOREGROUND;
use winapi::um::winuser::GetMessageW;
use winapi::um::winuser::GetWindowThreadProcessId;
use winapi::um::winuser::MSG;
use winapi::um::winuser::OBJID_WINDOW;
use winapi::um::winuser::{CallNextHookEx, SetWindowsHookExW, WH_KEYBOARD_LL, WH_MOUSE_LL};
use winapi::um::winuser::{
    DispatchMessageW, GetWindowTextLengthW, GetWindowTextW, SetWinEventHook,
    TranslateMessage, UnhookWinEvent, WINEVENT_OUTOFCONTEXT, WINEVENT_SKIPOWNPROCESS,
};
use winapi::um::winver::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW};
use winapi::um::psapi::{GetModuleFileNameExW, EnumProcessModulesEx};

#[derive(Copy, Clone, Debug)]
#[repr(C)]
pub struct MouseHookStruct {
    pub pt: POINT,
    pub hwnd: HWND,
    pub w_hit_test_code: UINT,
    pub dw_extra_info: ULONG_PTR,
}

#[derive(Copy, Clone, Debug)]
#[repr(C)]
struct KeyboardHookStruct {
    vk_code: DWORD,
    scan_code: DWORD,
    flags: DWORD,
    time: DWORD,
    dw_extra_info: ULONG_PTR,
}

#[derive(Copy, Clone, Debug)]
#[repr(C)]
pub struct POINT {
    pub x: i32,
    pub y: i32,
}

struct Program {
    path: String,
    description: String,
    active: bool
}



unsafe extern "system" fn mouse_hook_callback(
    n_code: i32,
    w_param: usize,
    l_param: isize,
) -> isize {
    if n_code >= 0 {
        let _mouse_input = *(l_param as *const MouseHookStruct);
        // println!("Mouse event {:?}", mouse_input);
    }
    CallNextHookEx(null_mut(), n_code, w_param, l_param)
}

unsafe extern "system" fn keyboard_hook_callback(
    n_code: i32,
    w_param: usize,
    l_param: isize,
) -> isize {
    if n_code >= 0 {
        let _kbd_input = *(l_param as *const KeyboardHookStruct);
        // println!("Keyboard event {:?}", kbd_input);
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

    let application_path = get_application_path(hwnd);

    let description = match get_application_description(&application_path) {
        Some(description) => description,
        None => {
            let file_stem = Path::new(&application_path)
                .file_stem()
                .unwrap()
                .to_str()
                .unwrap();
            file_stem.to_string()
        }
    };

    let program = Program {
        path: application_path,
        description,
        active: true
    };

}

 fn get_application_title(hwnd: HWND) -> Option<String> {
    // 获取窗口标题的长度
    let len = unsafe { GetWindowTextLengthW(hwnd) };
    if len == 0 {
        return None;
    }

    // 获取窗口标题
    let mut title: Vec<u16> = vec![0; len as usize + 1];
    let ret = unsafe { GetWindowTextW(hwnd, title.as_mut_ptr(), len + 1) };
    if ret == 0 {
        return None;
    }

    Some(String::from_utf16_lossy(&title))
}


 fn get_application_path(hwnd: HWND) -> String {
    let mut process_id = 0;
    unsafe { GetWindowThreadProcessId(hwnd, &mut process_id) };
    // 打开进程，获取进程句柄
    let process_handle = unsafe { OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, process_id) };
    // 获取进程可执行文件的路径
    let mut h_mod = null_mut();
    let mut cb_needed = 0;
    unsafe { EnumProcessModulesEx(
        process_handle,
        &mut h_mod,
        std::mem::size_of_val(&h_mod) as u32,
        &mut cb_needed,
        0x03,
    ) };
    let mut path: [u16; 260] = [0u16; 260];
    unsafe { GetModuleFileNameExW(process_handle, h_mod, path.as_mut_ptr(), path.len() as u32) };
    // 关闭进程句柄
    unsafe { CloseHandle(process_handle) };
    // 输出进程可执行文件的路径
    String::from_utf16_lossy(&path)
}

 fn get_language_code() -> String {
    let language_id = unsafe { GetUserDefaultUILanguage() };
    let code = format!("{:04X}", language_id);
    code
}

 fn get_application_description(application_path: &str) -> Option<String> {
    // 将应用程序路径转换为 UTF-16 编码
    let application_path: Vec<u16> = OsStr::new(application_path)
        .encode_wide()
        .chain(once(0))
        .collect();

    // 获取版本信息大小
    let mut handle = 0;
    let size = unsafe { GetFileVersionInfoSizeW(application_path.as_ptr(), &mut handle) };
    if size == 0 {
        return None;
    }

    // 获取版本信息
    let mut data = vec![0u8; size as usize];
    let result = unsafe { GetFileVersionInfoW(
        application_path.as_ptr(),
        handle,
        size,
        data.as_mut_ptr() as LPVOID,
    ) };
    if result == 0 {
        return None;
    }

    // 查询版本信息
    let mut value_ptr: LPVOID = ptr::null_mut();
    let mut value_size: DWORD = 0;

    let language = get_language_code();

    let result = unsafe { VerQueryValueW(
        data.as_ptr() as LPVOID,
        format!("\\StringFileInfo\\{}04B0\\FileDescription", language)
            .encode_utf16()
            .chain(iter::once(0))
            .collect::<Vec<u16>>()
            .as_ptr(),
        &mut value_ptr,
        &mut value_size,
    ) };
    if result == 0 || value_size == 0 {
        return None;
    }

    // 获取应用程序描述
    let value_ptr = value_ptr as *const u16;
    let description: Vec<u16> = unsafe { std::slice::from_raw_parts(value_ptr, value_size as usize).to_vec() };
    Some(String::from_utf16_lossy(&description))
}

 fn watch_input() {
    // 设置事件钩子
    let hook = unsafe { SetWinEventHook(
        EVENT_SYSTEM_FOREGROUND,
        EVENT_OBJECT_NAMECHANGE,
        ptr::null_mut(),
        Some(handle_event),
        0,
        0,
        WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS,
    ) };
    if hook.is_null() {
        return;
    }

    let _h_mouse_hook = unsafe { SetWindowsHookExW(WH_MOUSE_LL, Some(mouse_hook_callback), null_mut(), 0) };
    let _h_keyboard_hook =
        unsafe { SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_hook_callback), null_mut(), 0) };

    // 进入消息循环
    unsafe {
        let mut msg: MSG = mem::zeroed();
        loop {
            let ret = GetMessageW(&mut msg, ptr::null_mut(), 0, 0);
            if ret <= 0 {
                break;
            }
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
            CallNextHookEx(null_mut(), 0, 0, 0);
        }
    }

    // 卸载事件钩子
    unsafe { UnhookWinEvent(hook) };
}

pub fn run() {
    let handle1 = thread::spawn(|| {
          watch_input() ;
    });

    handle1.join().unwrap();
}
