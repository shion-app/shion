pub mod shared;
mod windows;

use shared::WatchOption;

pub fn run(option: WatchOption) {
    #[cfg(windows)]
    windows::run(option);
}

pub fn get_image_by_path(path: String) -> Vec<u8> {
    #[cfg(windows)]
    windows::get_image_by_path(path)
}
