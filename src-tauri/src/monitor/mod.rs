pub mod shared;
mod windows;

use std::cell::RefCell;
use std::thread;

use rdev::{listen, Event, EventType};
use shared::WatchOption;

thread_local! {
    static MOUSE: RefCell<Option<Box<dyn FnMut() -> ()>>> = RefCell::new(None);
    static KEYBOARD: RefCell<Option<Box<dyn FnMut() -> ()>>> = RefCell::new(None);
}

fn throttle<F>(func: F, limit: u64) -> impl FnMut()
where
    F: FnMut() + 'static,
{
    let mut last_call = std::time::Instant::now() - std::time::Duration::from_millis(limit);
    let mut func = Box::new(func);
    move || {
        if last_call.elapsed().as_millis() as u64 >= limit {
            func();
            last_call = std::time::Instant::now();
        }
    }
}

fn callback(event: Event) {
    match event.event_type {
        EventType::KeyPress(_) | EventType::KeyRelease(_) => {
            KEYBOARD.with(|i| {
                if let Some(f) = i.borrow_mut().as_mut() {
                    f();
                }
            });
        }
        EventType::ButtonPress(_)
        | EventType::ButtonRelease(_)
        | EventType::MouseMove { .. }
        | EventType::Wheel { .. } => {
            MOUSE.with(|i| {
                if let Some(f) = i.borrow_mut().as_mut() {
                    f();
                }
            });
        }
    };
}

pub fn run(option: WatchOption) {
    let mouse = throttle(option.mouse, 1000);
    let keyboard = throttle(option.keyboard, 1000);
    MOUSE.with(|f| *f.borrow_mut() = Some(Box::new(mouse)));
    KEYBOARD.with(|f| *f.borrow_mut() = Some(Box::new(keyboard)));

    thread::spawn(|| {
        #[cfg(windows)]
        windows::run(option.window);
    });

    if let Err(error) = listen(callback) {
        println!("Error: {:?}", error)
    }
}

pub fn get_image_by_path(path: String) -> Vec<u8> {
    #[cfg(windows)]
    windows::get_image_by_path(path)
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn watch() {
        run(WatchOption {
            window: Box::new(|program| println!("{:#?}", program.path)),
            mouse: Box::new(|| println!("mouse")),
            keyboard: Box::new(|| println!("keyboard")),
        });
    }
}
