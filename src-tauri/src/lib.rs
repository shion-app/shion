#[cfg(mobile)]
mod mobile;

use tauri::menu::{Menu, MenuItem};
use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create table",
        sql: include_str!("../../prisma/migrations/20240131101926_/migration.sql"),
        kind: MigrationKind::Up,
    }];

    #[tauri::command]
    fn get_sys_locale() -> String {
        sys_locale::get_locale().unwrap_or_else(|| String::from("en-US"))
    }

    let mut builder = tauri::Builder::default()
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
        // TODO: log bug
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
        .plugin(tauri_plugin_clipboard_manager::init());

    #[cfg(desktop)]
    {
        use tauri::{Manager, WebviewWindow};
        use tauri_plugin_autostart::MacosLauncher;

        use std::collections::HashMap;

        #[derive(Clone, serde::Serialize)]
        struct Payload {
            args: Vec<String>,
            cwd: String,
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
        fn open_folder(path: String) {
            open::that(path).unwrap();
        }

        #[tauri::command]
        fn open_devtools(window: WebviewWindow) {
            window.open_devtools();
        }

        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
                app.emit("single-instance", Payload { args: argv, cwd })
                    .unwrap();
                let window = app.get_webview_window("main").unwrap();
                window.show().unwrap();
            }))
            .plugin(tauri_plugin_autostart::init(
                MacosLauncher::LaunchAgent,
                None,
            ))
            .on_window_event(|window, event| match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    window.hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            })
            .invoke_handler(tauri::generate_handler![
                update_tray_menu,
                open_folder,
                open_devtools,
                get_sys_locale
            ]);
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::{
                    tray::{ClickType, TrayIconBuilder},
                    Manager,
                };

                let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&quit])?;

                let _ = TrayIconBuilder::with_id("tray")
                    .tooltip("shion")
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .menu_on_left_click(false)
                    .on_menu_event(move |app, event| match event.id().as_ref() {
                        "quit" => {
                            let window = app.get_webview_window("main").unwrap();
                            window.hide().unwrap();
                            app.emit_to("main", "quit", ()).unwrap();
                        }
                        _ => (),
                    })
                    .on_tray_icon_event(|tray, event| {
                        if event.click_type == ClickType::Double {
                            let app = tray.app_handle();
                            let window = app.get_webview_window("main").unwrap();
                            window.show().unwrap();
                        }
                    })
                    .build(app);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
