use clap::{Arg, Command};
use planif::enums::TaskCreationFlags;
use planif::schedule::TaskScheduler;
use planif::schedule_builder::{Action, ScheduleBuilder};
use planif::settings::{Duration, LogonType, PrincipalSettings, RunLevel, Settings};
use planif::task::Task;

const FOLDER: &'static str = "shion";
const TASK_NAME: &'static str = "auto start";

fn create_or_update_task(exe: String) -> Result<(), Box<dyn std::error::Error>> {
    let ts = TaskScheduler::new()?;
    let com = ts.get_com();
    let sb = ScheduleBuilder::new(&com)?;

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
        .action(Action::new("auto start", &exe, "", ""))?
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

fn enable_autostart() -> Result<(), Box<dyn std::error::Error>> {
    let _ts = TaskScheduler::new()?;
    let task = Task::new()?;
    task.enable(FOLDER, TASK_NAME)?;
    Ok(())
}

fn disable_autostart() -> Result<(), Box<dyn std::error::Error>> {
    let _ts = TaskScheduler::new()?;
    let task = Task::new()?;
    task.disable(FOLDER, TASK_NAME)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

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

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let matches = Command::new("autostart")
        .subcommand(
            Command::new("enable").about("Enable autostart").arg(
                Arg::new("path")
                    .help("The exe file to enable autostart")
                    .required(true),
            ),
        )
        .subcommand(Command::new("disable").about("Disable autostart"))
        .get_matches();

    match matches.subcommand() {
        Some(("enable", sub_m)) => {
            let path = sub_m.get_one::<String>("path").unwrap().to_string();
            create_or_update_task(path)?;
            enable_autostart()?;
        }
        Some(("disable", _)) => {
            disable_autostart()?;
        }
        _ => {
            eprintln!("Invalid command");
        }
    }

    Ok(())
}
