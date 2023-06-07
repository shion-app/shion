pub mod shared;
mod windows;

pub fn run(option: shared::WatchOption) {
    #[cfg(windows)]
    windows::run(option);
}
