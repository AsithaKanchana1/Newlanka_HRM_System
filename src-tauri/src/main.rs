// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use hrm_system_lib::{auth_commands, commands, init_db, AppDataDir, CurrentUser, DbConnection};
use std::sync::Mutex;
use tauri::Manager;

fn main() {
    // Fix for WebKit black screen issue on Linux
    #[cfg(target_os = "linux")]
    {
        // These environment variables help with WebKit rendering issues on Linux
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let (conn, app_dir) = init_db(app.handle()).expect("Failed to initialize database");
            app.manage(DbConnection(Mutex::new(conn)));
            app.manage(AppDataDir(app_dir));
            app.manage(CurrentUser(Mutex::new(None)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            auth_commands::login,
            auth_commands::logout,
            auth_commands::get_current_user,
            auth_commands::create_user,
            auth_commands::get_all_users,
            auth_commands::update_user,
            auth_commands::delete_user,
            auth_commands::reset_user_password,
            auth_commands::change_own_password,
            // Employee commands
            commands::init_database,
            commands::get_employees,
            commands::get_employee_by_epf,
            commands::create_employee,
            commands::update_employee,
            commands::delete_employee,
            commands::get_distinct_departments,
            commands::get_distinct_transport_routes,
            commands::get_distinct_police_areas,
            commands::get_distinct_designations,
            commands::get_distinct_allocations,
            commands::get_dashboard_stats,
            commands::save_employee_image,
            commands::get_employee_image,
            commands::export_database,
            commands::import_database,
            commands::get_database_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
