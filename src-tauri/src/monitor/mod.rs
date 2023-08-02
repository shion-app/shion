pub mod shared;
mod windows;

use std::cell::RefCell;
use std::thread;

use rdev::{listen, Event, EventType};
use shared::WatchOption;

thread_local! {
    static MOUSE: RefCell<Option<Box<dyn Fn() -> ()>>> = RefCell::new(None);
    static KEYBOARD: RefCell<Option<Box<dyn Fn() -> ()>>> = RefCell::new(None);
}

fn callback(event: Event) {
    match event.event_type {
        EventType::KeyPress(_) | EventType::KeyRelease(_) => {
            KEYBOARD.with(|i| {
                if let Some(f) = &*i.borrow() {
                    f();
                }
            });
        }
        EventType::ButtonPress(_)
        | EventType::ButtonRelease(_)
        | EventType::MouseMove { .. }
        | EventType::Wheel { .. } => {
            MOUSE.with(|i| {
                if let Some(f) = &*i.borrow() {
                    f();
                }
            });
        }
    };
}

pub fn run(option: WatchOption) {
    MOUSE.with(|f| *f.borrow_mut() = Some(Box::new(option.mouse)));
    KEYBOARD.with(|f| *f.borrow_mut() = Some(Box::new(option.keyboard)));

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
