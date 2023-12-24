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
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .targets([
                    Target::new(TargetKind::LogDir {
                        file_name: Some("webview".into()),
                    })
                    .filter(|metadata| metadata.target() == WEBVIEW_TARGET),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("rust".into()),
                    })
                    .filter(|metadata| metadata.target() != WEBVIEW_TARGET),
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                ])
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .build(),
        );

    #[cfg(desktop)]
    {
        use tauri::Manager;
        use tauri_plugin_autostart::MacosLauncher;

        use std::{
            collections::HashMap,
            sync::{
                atomic::{AtomicBool, Ordering::Relaxed},
                Arc,
            },
            thread,
        };

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

        static IS_SEND_PROGRAM: AtomicBool = AtomicBool::new(false);

        #[tauri::command]
        fn toggle_filter_program(data: bool) {
            IS_SEND_PROGRAM.store(data, Relaxed);
        }

        #[tauri::command]
        fn is_audio_active(path: String) -> bool {
            // TODO: upgrade
            // unsafe { AUDIO_CONTEXT.as_ref().unwrap().is_active(path) }
            false
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
                is_audio_active
            ]);
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

            // TODO: upgrade

            // let app_handle = Arc::new(app.handle());
            // let app_handle_clone = app_handle.clone();
            // let filter = {
            //     let app_handle = app_handle_clone.clone();
            //     move |program: Program| {
            //         let is_send_program = IS_SEND_PROGRAM.load(Relaxed);
            //         if is_send_program {
            //             app_handle.emit_all("filter-program", program).unwrap();
            //         }
            //     }
            // };
            // let mouse = {
            //     let app_handle = app_handle_clone.clone();
            //     move |path| {
            //         app_handle
            //             .emit_all("window-activate", Activity { path })
            //             .unwrap();
            //     }
            // };
            // let audio = {
            //     let app_handle = app_handle_clone.clone();
            //     move |state, path| {
            //         app_handle
            //             .emit_all("audio-activity", AudioActivity { state, path })
            //             .unwrap();
            //     }
            // };

            // thread::spawn(|| {
            //     monitor::run(WatchOption {
            //         filter: Box::new(filter),
            //         mouse: Box::new(mouse.clone()),
            //         keyboard: Box::new(mouse),
            //         audio: Box::new(audio),
            //     });
            // });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
