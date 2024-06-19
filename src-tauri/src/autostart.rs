use std::env::current_exe;
use std::sync::mpsc;
use std::thread;

use anyhow::anyhow;
use planif::enums::TaskCreationFlags;
use planif::schedule::TaskScheduler;
use planif::schedule_builder::{Action, ScheduleBuilder};
use planif::settings::{Duration, LogonType, PrincipalSettings, RunLevel};

use crate::Result;

fn spawn_autostart(enabled: bool) -> Result<()> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let _ = tx.send(autostart(enabled).map_err(|e| anyhow!(e.to_string())));
    });

    Ok(rx.recv().map_err(|e| anyhow!(e))??)
}

fn autostart(enabled: bool) -> std::result::Result<(), Box<dyn std::error::Error>> {
    let ts = TaskScheduler::new()?;
    let com = ts.get_com();
    let sb = ScheduleBuilder::new(&com).unwrap();

    let exe = current_exe()?;
    let exe = exe.to_str().unwrap();

    let settings = PrincipalSettings {
        display_name: "".to_string(),
        group_id: None,
        id: "".to_string(),
        logon_type: LogonType::InteractiveToken,
        run_level: RunLevel::Highest,
        user_id: Some(whoami::username()),
    };

    sb.create_logon()
        .author("hanaTsuk1")?
        .trigger("trigger", enabled)?
        .action(Action::new("auto start", exe, "", ""))?
        .in_folder("shion")?
        .principal(settings)?
        .delay(Duration {
            seconds: Some(6),
            ..Default::default()
        })?
        .build()?
        .register("auto start", TaskCreationFlags::CreateOrUpdate as i32)?;
    Ok(())
}

pub fn enable() -> Result<()> {
    spawn_autostart(true)
}

pub fn disable() -> Result<()> {
    spawn_autostart(false)
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
            "User's Name            whoami::realname():    {}",
            whoami::realname(),
        );
        println!(
            "User's Username        whoami::username():    {}",
            whoami::username(),
        );
    }
}
