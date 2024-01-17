#[cfg(mobile)]
mod mobile;

use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy, WEBVIEW_TARGET};
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create table",
            sql: include_str!("../../prisma/migrations/20230923052127_/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add overview",
            sql: include_str!("../../prisma/migrations/20231201100249_/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add created_at updated_at",
            sql: include_str!("../../prisma/migrations/20240109024738_/migration.sql"),
            kind: MigrationKind::Up,
        },
    ];

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
        .plugin(tauri_plugin_shion_watcher::init());
    // TODO: log bug
    // .plugin(
    //     tauri_plugin_log::Builder::new()
    //         .clear_targets()
    //         .targets([
    //             Target::new(TargetKind::LogDir {
    //                 file_name: Some("webview".into()),
    //             })
    //             .filter(|metadata| metadata.target() == WEBVIEW_TARGET),
    //             Target::new(TargetKind::LogDir {
    //                 file_name: Some("rust".into()),
    //             })
    //             .filter(|metadata| metadata.target() != WEBVIEW_TARGET),
    //             Target::new(TargetKind::Stdout),
    //             Target::new(TargetKind::Webview),
    //         ])
    //         .timezone_strategy(TimezoneStrategy::UseLocal)
    //         .build(),
    // );

    #[cfg(desktop)]
    {
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
            for (key, value) in data {
                let menu = app.menu();
                if let Some(menu) = menu {
                    let item = menu.get(key.as_str()).unwrap();
                    let menu_item = item.as_menuitem().unwrap();
                    menu_item.set_text(value).unwrap();
                }
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
            .invoke_handler(tauri::generate_handler![update_tray_menu,]);
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::{
                    menu::{MenuBuilder, MenuItemBuilder},
                    tray::{ClickType, TrayIconBuilder},
                    Manager,
                };
                use window_shadows::set_shadow;

                let window = app.get_window("main").unwrap();
                set_shadow(&window, true).unwrap();

                let quit = MenuItemBuilder::with_id("quit", "Quit").build(app);
                let menu = MenuBuilder::new(app).items(&[&quit]).build()?;
                let tray = TrayIconBuilder::new()
                    .menu(&menu)
                    .on_menu_event(move |app, event| match event.id().as_ref() {
                        "quit" => {
                            let window = app.get_window("main").unwrap();
                            window.hide().unwrap();
                            app.emit_to("main", "quit", ()).unwrap();
                        }
                        _ => (),
                    })
                    .on_tray_icon_event(|tray, event| {
                        if event.click_type == ClickType::Double {
                            let app = tray.app_handle();
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                        }
                    })
                    .build(app)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
