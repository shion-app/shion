use std::sync::mpsc;
use std::thread;

use anyhow::anyhow;
use planif::schedule::TaskScheduler;
use planif::task::Task;

use crate::Result;

const FOLDER: &'static str = "shion";
const TASK_NAME: &'static str = "auto start";

fn spawn_state<T: FnOnce() -> Result<bool> + Send + 'static>(cb: T) -> Result<bool> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let _ = tx.send(cb().map_err(|e| anyhow!(e.to_string())));
    });

    Ok(rx.recv().map_err(|e| anyhow!(e))??)
}

pub fn is_enabled() -> Result<bool> {
    spawn_state(|| {
        let _ts = TaskScheduler::new()?;
        let task = Task::new()?;
        Ok(task.is_enabled(FOLDER, TASK_NAME)?)
    })
}
