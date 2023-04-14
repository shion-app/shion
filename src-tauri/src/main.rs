// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_log::{LogTarget};
use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
fn main() {
    let migrations = vec![Migration{
        version: 1,
        description: "create table",
        sql: include_str!("../migrations/20230413021540_create-table.sql"),
        kind: MigrationKind::Up
    }];
    let db_url = format!("sqlite:data{}.db", if cfg!(debug_assertions) { "-dev" } else { "" });
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().add_migrations(&db_url, migrations).build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::default().targets([
            LogTarget::LogDir,
            LogTarget::Stdout,
            LogTarget::Webview,
        ]).build())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
