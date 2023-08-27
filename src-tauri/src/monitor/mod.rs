pub mod shared;
mod windows;

use std::cell::RefCell;

use rdev::{listen, Event, EventType};
use shared::{AudioContext, WatchOption};

use windows::{get_foreground_application_path, get_mouse_area_application_path};

thread_local! {
    static MOUSE: RefCell<Option<Box<dyn FnMut(String) -> ()>>> = RefCell::new(None);
    static KEYBOARD: RefCell<Option<Box<dyn FnMut(String) -> ()>>> = RefCell::new(None);
}

pub static mut AUDIO_CONTEXT: Option<Box<dyn AudioContext>> = None;

fn throttle<F>(func: F, limit: u64) -> impl FnMut(String)
where
    F: FnMut(String) + 'static,
{
    let mut last_call = std::time::Instant::now() - std::time::Duration::from_millis(limit);
    let mut last_path = String::new();
    let mut func = Box::new(func);
    move |path| {
        if last_call.elapsed().as_millis() as u64 >= limit || path != last_path {
            func(path.clone());
            last_call = std::time::Instant::now();
            last_path = path.clone();
        }
    }
}

fn callback(event: Event) {
    match event.event_type {
        EventType::KeyPress(_) | EventType::KeyRelease(_) => {
            KEYBOARD.with(|i| {
                if let Some(f) = i.borrow_mut().as_mut() {
                    if let Some(path) = get_foreground_application_path() {
                        f(path);
                    }
                }
            });
        }
        EventType::ButtonPress(_) | EventType::ButtonRelease(_) | EventType::Wheel { .. } => {
            MOUSE.with(|i| {
                if let Some(f) = i.borrow_mut().as_mut() {
                    if let Some(path) = get_mouse_area_application_path() {
                        f(path);
                    }
                }
            });
        }
        EventType::MouseMove { .. } => {}
    };
}

pub fn run(option: WatchOption) {
    let mouse = throttle(option.mouse, 1000);
    let keyboard = throttle(option.keyboard, 1000);
    MOUSE.with(|f| *f.borrow_mut() = Some(Box::new(mouse)));
    KEYBOARD.with(|f| *f.borrow_mut() = Some(Box::new(keyboard)));

    windows::run(option.audio, option.filter);

    if let Err(error) = listen(callback) {
        println!("Error: {:?}", error)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn watch() {
        run(WatchOption {
            filter: Box::new(|program| println!("filter {:#?}", program.path)),
            mouse: Box::new(|path| println!("mouse {}", path)),
            keyboard: Box::new(|path| println!("keyboard {}", path)),
            audio: Box::new(|state, name| {
                println!("{:?}", state);
                println!("{}", name);
            }),
        });
    }
}
