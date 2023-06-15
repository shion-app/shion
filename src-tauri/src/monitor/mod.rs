pub mod shared;
mod windows;

use shared::WatchOption;

pub fn run(option: WatchOption) {
    #[cfg(windows)]
    windows::run(option);
}
