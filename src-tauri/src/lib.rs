#[cfg(mobile)]
mod mobile;

mod autostart;
mod database;
mod error;
mod server;

use std::{
    collections::HashMap,
    env::{current_dir, current_exe},
    path::PathBuf,
    sync::Mutex,
    thread,
    time::Duration,
};

use anyhow::anyhow;
use lazy_static::lazy_static;
use parse_changelog::Changelog;
use reqwest::StatusCode;
use runas::Command as SudoCommand;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, Wry,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};
use tauri_plugin_sql::{DbInstances, Migration, MigrationKind};
use tauri_plugin_store::{with_store, StoreCollection};
use zip_extensions::{zip_create_from_directory, zip_extract};

use crate::database::command::{
    begin_transaction, commit_transaction, execute_transaction, rollback_transaction,
    select_transaction,
};
use database::command::Transaction;
pub use error::Result;

lazy_static! {
    static ref SERVER_PORT: Mutex<u16> = Mutex::new(15785);
}

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

pub async fn get_db(app: &AppHandle) -> sqlx::Pool<sqlx::Sqlite> {
    let instances = app.state::<DbInstances>();
    let instances = instances.inner().0.lock().await;
    let db = instances.get("sqlite:data.db").unwrap();
    db.clone()
}

fn start_server(app_handle: &AppHandle, server_port: u16) {
    *SERVER_PORT.lock().unwrap() = server_port;
    let boxed_app_handle = Box::new(app_handle.clone());
    thread::spawn(move || server::init(*boxed_app_handle, server_port).unwrap());
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

    #[tauri::command]
    async fn restart_api_service(app_handle: AppHandle, server_port: u16) -> Result<()> {
        let old_server_port = *SERVER_PORT.lock().unwrap();
        let client = reqwest::Client::builder().build()?;
        let _ = client
            .post(format!("http://localhost:{}/api/stop", old_server_port))
            .send()
            .await;
        start_server(&app_handle, server_port);

        let client = reqwest::Client::builder().build()?;
        let res = client
            .get(format!("http://localhost:{}/api/ping", server_port))
            .timeout(Duration::from_secs(5))
            .send()
            .await?;
        res.error_for_status()?;
        Ok(())
    }

    #[tauri::command]
    async fn is_api_service_active() -> Result<bool> {
        let old_server_port = *SERVER_PORT.lock().unwrap();
        let res = reqwest::get(format!("http://localhost:{}/api/ping", old_server_port))
            .await?
            .status();
        Ok(res == StatusCode::OK)
    }

    #[tauri::command]
    fn open_with_detached(path: String, arg: String) -> Result<()> {
        Ok(open::with_detached(arg, path)?)
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
            restart_api_service,
            is_api_service_active,
            open_with_detached,
            begin_transaction,
            execute_transaction,
            select_transaction,
            commit_transaction,
            rollback_transaction
        ])
        .setup(|app| {
            let app_handle = app.app_handle();

            let stores = app_handle.state::<StoreCollection<Wry>>();

            let launch_visible = with_store(
                app.app_handle().clone(),
                stores.clone(),
                "config.json",
                |store| {
                    if let Some(value) = store.get("launchVisible") {
                        if let Some(launch_visible) = value.as_bool() {
                            return Ok(launch_visible);
                        }
                    }
                    Ok(true)
                },
            )?;

            let server_port =
                with_store(app_handle.clone(), stores.clone(), "config.json", |store| {
                    if let Some(value) = store.get("serverPort") {
                        if let Some(server_port) = value.as_u64() {
                            return Ok(server_port as u16);
                        }
                    }
                    Ok(15785)
                })? as u16;

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

            start_server(&app_handle, server_port);

            Ok(())
        })
        .manage(Transaction::new())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
