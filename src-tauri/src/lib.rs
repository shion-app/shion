#[cfg(mobile)]
mod mobile;

mod error;
pub use error::Result;
mod autostart;

use parse_changelog::Changelog;
use tauri::menu::{Menu, MenuItem};
use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};
use tauri_plugin_sql::{Migration, MigrationKind};

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
    ];

    #[tauri::command]
    fn get_sys_locale() -> String {
        sys_locale::get_locale().unwrap_or_else(|| String::from("en-US"))
    }

    #[tauri::command]
    fn parse_changelog_from_text<'a>(text: &'a str) -> Result<Changelog<'a>> {
        Ok(parse_changelog::parse(text)?)
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
        .plugin(tauri_plugin_shion_history::init())
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
        use zip_extensions::{zip_create_from_directory, zip_extract};

        use std::collections::HashMap;
        use std::path::PathBuf;

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
        fn enable_autostart() -> Result<()> {
            autostart::enable()
        }

        #[tauri::command]
        fn disable_autostart() -> Result<()> {
            autostart::disable()
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
                get_sys_locale,
                compress,
                decompress,
                parse_changelog_from_text,
                enable_autostart,
                disable_autostart,
            ]);
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::{
                    tray::{ClickType, TrayIconBuilder},
                    Manager, WebviewUrl, WebviewWindowBuilder, Wry,
                };
                use tauri_plugin_store::{with_store, StoreCollection};

                let title = if tauri::dev() { "shion-dev" } else { "shion" };

                let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&quit])?;

                let _ = TrayIconBuilder::with_id("tray")
                    .tooltip(title)
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

                WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                    .visible(launch_visible)
                    .center()
                    .decorations(false)
                    .fullscreen(false)
                    .resizable(false)
                    .inner_size(1152.0, 648.0)
                    .title(title)
                    .build()
                    .unwrap();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
