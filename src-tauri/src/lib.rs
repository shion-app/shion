#[cfg(mobile)]
mod mobile;

mod autostart;
mod database;
mod error;

use std::collections::HashMap;
use std::env::{current_dir, current_exe};
use std::path::PathBuf;

use anyhow::anyhow;
use parse_changelog::Changelog;
use runas::Command as SudoCommand;
use tauri::WebviewWindow;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
use tauri::{WebviewUrl, WebviewWindowBuilder, Wry};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_store::{with_store, StoreCollection};
use zip_extensions::{zip_create_from_directory, zip_extract};

use crate::database::command::{
    begin_transaction, commit_transaction, execute_transaction, rollback_transaction,
    select_transaction,
};
use database::command::Transaction;
pub use error::Result;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn show_window(app: &AppHandle, label: &str) -> tauri::Result<()> {
    let window = app.get_webview_window(label).unwrap();
    let is_visible = window.is_visible()?;
    if is_visible {
        window.unminimize()?;
    } else {
        window.show()?;
    }
    window.set_focus()?;
    Ok(())
}

fn get_autostart_bin() -> String {
    let path = if tauri::is_dev() {
        let dir = current_dir().unwrap();
        dir.join("../src-autostart/target/debug/autostart.exe")
    } else {
        let exe = current_exe().unwrap();
        // bug: https://github.com/tauri-apps/tauri/pull/10293
        exe.join("../bin/autostart.exe/autostart.exe")
    };
    path.to_str().unwrap().to_string()
}

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create table",
            sql: include_str!("../../prisma/migrations/20240131101926_/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add domain and history",
            sql: include_str!("../../prisma/migrations/20240419081000_/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add remark",
            sql: include_str!("../../prisma/migrations/20240811105024_/migration.sql"),
            kind: MigrationKind::Up,
        },
    ];

    #[tauri::command]
    fn get_sys_locale() -> String {
        sys_locale::get_locale().unwrap_or_else(|| String::from("en-US"))
    }

    #[tauri::command]
    fn parse_changelog_from_text<'a>(text: &'a str) -> Result<Changelog<'a>> {
        Ok(parse_changelog::parse(text)?)
    }

    #[tauri::command]
    fn update_tray_menu(app: tauri::AppHandle, data: HashMap<String, String>) {
        if let Some(tray) = app.tray_by_id("tray") {
            let quit = data.get("quit").unwrap();
            let quit = MenuItem::with_id(&app, "quit", quit, true, None::<&str>).unwrap();
            let menu = Menu::with_items(&app, &[&quit]).unwrap();
            tray.set_menu(Some(menu)).unwrap();
        }
    }

    #[tauri::command]
    fn open_devtools(window: WebviewWindow) {
        window.open_devtools();
    }

    #[tauri::command]
    fn compress(target: PathBuf, dest: PathBuf) -> Result<()> {
        zip_create_from_directory(&dest, &target)?;
        Ok(())
    }

    #[tauri::command]
    fn decompress(target: PathBuf, dest: PathBuf) -> Result<()> {
        zip_extract(&target, &dest)?;
        Ok(())
    }

    #[tauri::command]
    fn enable_admin_autostart() -> Result<()> {
        let autostart_bin = get_autostart_bin();
        let path = current_exe()?;
        let status = SudoCommand::new(autostart_bin)
            .arg("enable")
            .arg(path)
            .show(false)
            .status()?;

        if status.success() {
            Ok(())
        } else {
            Err(anyhow!("autostart enable error").into())
        }
    }

    #[tauri::command]
    fn disable_admin_autostart() -> Result<()> {
        let autostart_bin = get_autostart_bin();
        let status = SudoCommand::new(autostart_bin)
            .arg("disable")
            .show(false)
            .status()?;

        if status.success() {
            Ok(())
        } else {
            Err(anyhow!("autostart disable error").into())
        }
    }

    #[tauri::command]
    fn is_enabled_admin_autostart() -> bool {
        autostart::is_enabled().unwrap_or(false)
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:data.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_shion_watcher::init())
        .plugin(tauri_plugin_shion_history::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            app.emit("single-instance", Payload { args: argv, cwd })
                .unwrap();
            let _ = show_window(app, "main");
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            update_tray_menu,
            open_devtools,
            get_sys_locale,
            compress,
            decompress,
            parse_changelog_from_text,
            enable_admin_autostart,
            disable_admin_autostart,
            is_enabled_admin_autostart,
            begin_transaction,
            execute_transaction,
            select_transaction,
            commit_transaction,
            rollback_transaction
        ])
        .setup(|app| {
            let stores = app.app_handle().state::<StoreCollection<Wry>>();

            let launch_visible =
                with_store(app.app_handle().clone(), stores, "config.json", |store| {
                    if let Some(value) = store.get("launchVisible") {
                        if let Some(launch_visible) = value.as_bool() {
                            return Ok(launch_visible);
                        }
                    }
                    Ok(true)
                })?;

            let title = if tauri::is_dev() {
                "shion-dev"
            } else {
                "shion"
            };

            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;

            TrayIconBuilder::with_id("tray")
                .tooltip(title)
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "quit" => {
                        app.emit_to("main", "quit", ()).unwrap();
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let _ = show_window(app, "main");
                    }
                })
                .build(app)?;

            WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .visible(launch_visible)
                .center()
                .decorations(false)
                .fullscreen(false)
                .resizable(false)
                .inner_size(1152.0, 648.0)
                .title(title)
                .build()?;

            Ok(())
        })
        .manage(Transaction::new())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
