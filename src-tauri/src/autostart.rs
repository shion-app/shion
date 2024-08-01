use std::env::current_exe;
use std::sync::mpsc;
use std::thread;

use anyhow::anyhow;
use planif::enums::TaskCreationFlags;
use planif::schedule::TaskScheduler;
use planif::schedule_builder::{Action, ScheduleBuilder};
use planif::settings::{Duration, LogonType, PrincipalSettings, RunLevel, Settings};
use planif::task::Task;

use crate::Result;

const FOLDER: &'static str = "shion";
const TASK_NAME: &'static str = "auto start";

fn spawn_action<T: FnOnce() -> Result<()> + Send + 'static>(cb: T) -> Result<()> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let _ = tx.send(cb().map_err(|e| anyhow!(e.to_string())));
    });

    Ok(rx.recv().map_err(|e| anyhow!(e))??)
}

fn spawn_state<T: FnOnce() -> Result<bool> + Send + 'static>(cb: T) -> Result<bool> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let _ = tx.send(cb().map_err(|e| anyhow!(e.to_string())));
    });

    Ok(rx.recv().map_err(|e| anyhow!(e))??)
}

fn create_or_update_task() -> Result<()> {
    let ts = TaskScheduler::new()?;
    let com = ts.get_com();
    let sb = ScheduleBuilder::new(&com)?;

    let exe = current_exe()?;
    let exe = exe.to_str().unwrap();

    let mut settings = Settings::new();
    settings.stop_if_going_on_batteries = Some(false);
    settings.disallow_start_if_on_batteries = Some(false);
    settings.enabled = Some(true);

    let user_id = format!("{}\\{}", whoami::devicename(), whoami::username());

    let principal_settings = PrincipalSettings {
        display_name: "".to_string(),
        group_id: None,
        id: "".to_string(),
        logon_type: LogonType::InteractiveToken,
        run_level: RunLevel::Highest,
        user_id: Some(user_id.clone()),
    };

    sb.create_logon()
        .author("hanaTsuk1")?
        .trigger("trigger", true)?
        .action(Action::new("auto start", exe, "", ""))?
        .in_folder(FOLDER)?
        .principal(principal_settings)?
        .settings(settings)?
        .delay(Duration {
            seconds: Some(10),
            ..Default::default()
        })?
        .build()?
        .register(TASK_NAME, TaskCreationFlags::CreateOrUpdate as i32)?;
    Ok(())
}

pub fn enable() -> Result<()> {
    spawn_action(|| {
        create_or_update_task()?;
        let task = Task::new()?;
        task.enable(FOLDER, TASK_NAME)?;
        Ok(())
    })
}

pub fn disable() -> Result<()> {
    spawn_action(|| {
        let task = Task::new()?;
        task.disable(FOLDER, TASK_NAME)?;
        Ok(())
    })
}

pub fn is_enabled() -> Result<bool> {
    spawn_state(|| {
        let task = Task::new()?;
        Ok(task.is_enabled(FOLDER, TASK_NAME)?)
    })
}

mod tests {
    use super::*;

    #[test]
    fn test_enable() -> Result<()> {
        enable()
    }

    #[test]
    fn test_disable() -> Result<()> {
        disable()
    }

    #[test]
    fn test_whoami() {
        println!(
            "User's Name            whoami::devicename():    {}",
            whoami::devicename(),
        );
        println!(
            "User's Name            whoami::realname():    {}",
            whoami::realname(),
        );
        println!(
            "User's Username        whoami::username():    {}",
            whoami::username(),
        );
    }
}
