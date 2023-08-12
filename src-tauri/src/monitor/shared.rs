use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Program {
    pub path: String,
    pub description: String,
    pub icon: Vec<u8>,
}

pub type WatchWindowOption = Box<dyn Fn(Program) -> () + Send>;

pub struct WatchOption {
    pub window: WatchWindowOption,
    pub mouse: Box<dyn Fn() -> ()>,
    pub keyboard: Box<dyn Fn() -> ()>,
}

#[derive(Clone, Serialize)]
pub struct Activity {
    pub time: u128,
    pub path: String,
}
