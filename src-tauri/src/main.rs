// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use hrm_system_lib::{commands, init_db, DbConnection};
use std::sync::Mutex;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let conn = init_db(app.handle()).expect("Failed to initialize database");
            app.manage(DbConnection(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::init_database,
            commands::get_employees,
            commands::create_employee,
            commands::update_employee,
            commands::delete_employee,
            commands::get_distinct_departments,
            commands::get_distinct_transport_routes,
            commands::get_dashboard_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
