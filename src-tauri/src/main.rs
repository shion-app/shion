// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicBool, Ordering::Relaxed},
        Arc,
    },
    thread,
};

use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};
use tauri_plugin_log::{LogTarget, TimezoneStrategy};
use tauri_plugin_sql::{Migration, MigrationKind};

use shion::monitor::{
    self,
    shared::{Activity, AudioActivity, Program, WatchOption},
    AUDIO_CONTEXT,
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[tauri::command]
fn update_tray_menu(app: tauri::AppHandle, data: HashMap<String, String>) {
    for (key, value) in data {
        let item_handle = app.tray_handle().get_item(key.as_str());
        item_handle.set_title(value).unwrap();
    }
}

static IS_SEND_PROGRAM: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn toggle_filter_program(data: bool) {
    IS_SEND_PROGRAM.store(data, Relaxed);
}

#[tauri::command]
fn get_image_by_path(path: String) -> Vec<u8> {
    monitor::get_image_by_path(path)
}

#[tauri::command]
fn is_audio_active(path: String) -> bool {
    unsafe { AUDIO_CONTEXT.as_ref().unwrap().is_active(path) }
}

fn main() {
    let migrations = vec![Migration {
        version: 1,
        description: "create table",
        sql: include_str!("../migrations/20230413021540_create-table.sql"),
        kind: MigrationKind::Up,
    }];
    let db_url = format!(
        "sqlite:data{}.db",
        if cfg!(debug_assertions) { "-dev" } else { "" }
    );

    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let tray_menu = SystemTrayMenu::new().add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&db_url, migrations)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
        }))
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                    app.emit_to("main", "quit", ()).unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            update_tray_menu,
            toggle_filter_program,
            get_image_by_path,
            is_audio_active
        ])
        .setup(|app| {
            let app_handle = Arc::new(app.handle());
            let app_handle_clone = app_handle.clone();
            let window = {
                let app_handle = app_handle_clone.clone();
                move |program: Program| {
                    let is_send_program = IS_SEND_PROGRAM.load(Relaxed);
                    if is_send_program {
                        app_handle.emit_all("filter-program", program).unwrap();
                    } else {
                        let activity = Activity { path: program.path };
                        app_handle.emit_all("window-activity", activity).unwrap();
                    }
                }
            };
            let mouse = {
                let app_handle = app_handle_clone.clone();
                move || {
                    let is_send_program = IS_SEND_PROGRAM.load(Relaxed);
                    if !is_send_program {
                        app_handle.emit_all("window-activate", ()).unwrap();
                    }
                }
            };
            let audio = {
                let app_handle = app_handle_clone.clone();
                move |state, name| {
                    app_handle
                        .emit_all("audio-activity", AudioActivity { state, path: name })
                        .unwrap();
                }
            };

            thread::spawn(|| {
                monitor::run(WatchOption {
                    window: Box::new(window),
                    mouse: Box::new(mouse.clone()),
                    keyboard: Box::new(mouse),
                    audio: Box::new(audio),
                });
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
