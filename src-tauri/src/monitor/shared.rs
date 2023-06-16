use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Program {
    pub path: String,
    pub description: String,
    pub title: String,
}

pub struct WatchOption {
    pub window: Box<dyn Fn(Program) -> ()>,
    pub mouse: Box<dyn Fn() -> ()>,
    pub keyboard: Box<dyn Fn() -> ()>,
}

#[derive(Clone, Serialize)]

pub struct Activity {
    pub time: u128,
    pub path: String,
    pub title: String,
}
