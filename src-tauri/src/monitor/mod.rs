mod windows;

pub fn run() {
    #[cfg(windows)]
    windows::run();
}
