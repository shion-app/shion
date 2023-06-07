#[derive(Debug)]
pub struct Program {
    pub path: String,
    pub description: String,
    pub title: String,
}

pub struct WatchOption {
    pub window: fn(Program) -> (),
    pub mouse: fn() -> (),
    pub keyboard: fn() -> (),
}
