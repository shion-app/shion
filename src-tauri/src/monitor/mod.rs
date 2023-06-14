mod shared;
mod windows;

use std::sync::Arc;

use shared::{WatchOption, Program};

pub struct Monitor {
    app_handle: Arc<tauri::AppHandle>,
    window_handler: Box<dyn Fn(Program) -> ()>,
}

impl Monitor {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Monitor {
            app_handle: Arc::new(app_handle),
            window_handler: Box::new(|_| {}),
        }
    }

    pub fn set_window(mut self, f: fn(Arc<tauri::AppHandle>, Program) -> ()) -> Self {
        let app_handle = self.app_handle.clone();
        self.window_handler = Box::new(move |p| f(app_handle.clone(), p));
        self
    }

    pub fn run(self) {
        let option = WatchOption {
            window: self.window_handler,
            mouse: Box::new(|| {}),
            keyboard: Box::new(|| {}),
        };
        #[cfg(windows)]
        windows::run(option);
    }
}
