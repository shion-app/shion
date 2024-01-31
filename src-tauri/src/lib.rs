#[cfg(mobile)]
mod mobile;

use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create table",
        sql: include_str!("../../prisma/migrations/20240131101926_/migration.sql"),
        kind: MigrationKind::Up,
    }];

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
        .plugin(tauri_plugin_shion_synchronizer::init())
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
        .plugin(tauri_plugin_dialog::init());

    #[cfg(desktop)]
    {
        use tauri::menu::MenuBuilder;
        use tauri::menu::MenuItemBuilder;
        use tauri::Manager;
        use tauri_plugin_autostart::MacosLauncher;

        use std::collections::HashMap;

        #[derive(Clone, serde::Serialize)]
        struct Payload {
            args: Vec<String>,
            cwd: String,
        }

        #[tauri::command]
        fn update_tray_menu(app: tauri::AppHandle, data: HashMap<String, String>) {
            let tray = app.tray();
            if let Some(tray) = tray {
                let quit = data.get("quit").unwrap();
                let quit = MenuItemBuilder::with_id("quit", quit).build(&app);
                let menu = MenuBuilder::new(&app).items(&[&quit]).build().unwrap();
                tray.set_menu(Some(menu)).unwrap();
            }
        }

        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
                app.emit("single-instance", Payload { args: argv, cwd })
                    .unwrap();
                let window = app.get_window("main").unwrap();
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
            .invoke_handler(tauri::generate_handler![update_tray_menu]);
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::menu::{MenuBuilder, MenuItemBuilder};
                use tauri::{tray::ClickType, Manager};
                use window_shadows::set_shadow;

                let window = app.get_window("main").unwrap();
                set_shadow(&window, true).unwrap();

                let quit = MenuItemBuilder::with_id("quit", "Quit").build(app);
                let menu = MenuBuilder::new(app).items(&[&quit]).build()?;
                let tray = app.tray().unwrap();
                tray.on_menu_event(move |app, event| match event.id().as_ref() {
                    "quit" => {
                        let window = app.get_window("main").unwrap();
                        window.hide().unwrap();
                        app.emit_to("main", "quit", ()).unwrap();
                    }
                    _ => (),
                });
                tray.on_tray_icon_event(|tray, event| {
                    if event.click_type == ClickType::Double {
                        let app = tray.app_handle();
                        let window = app.get_window("main").unwrap();
                        window.show().unwrap();
                    }
                });
                tray.set_menu(Some(menu)).unwrap();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
