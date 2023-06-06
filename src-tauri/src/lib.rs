mod monitor;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn run() {
        monitor::run();
    }
}
