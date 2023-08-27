use nodio_win32::SessionState;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Program {
    pub path: String,
    pub description: String,
    pub icon: Vec<u8>,
}

pub type WatchWindowOption = Box<dyn Fn(Program) + Send>;

pub type WatchAudioOption = Box<dyn Fn(SessionState, String) + Send + Sync + 'static>;

pub struct WatchOption {
    pub window: WatchWindowOption,
    pub filter: WatchWindowOption,
    pub mouse: Box<dyn Fn(String) -> ()>,
    pub keyboard: Box<dyn Fn(String) -> ()>,
    pub audio: WatchAudioOption,
}

#[derive(Clone, Serialize)]
pub struct Activity {
    pub path: String,
}

#[derive(Clone, Serialize)]
pub struct AudioActivity {
    pub state: SessionState,
    pub path: String,
}

pub trait AudioContext {
    fn is_active(&self, path: String) -> bool;
}
