pub mod monitor;

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn watch() {
        monitor::run(monitor::shared::WatchOption {
            window: |program| println!("{:#?}", program),
            // mouse: || println!("mouse move"),
            // keyboard: || println!("key press"),
            mouse: || {},
            keyboard: || {},
        });
    }
}
