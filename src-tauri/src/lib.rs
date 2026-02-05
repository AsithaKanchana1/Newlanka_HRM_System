use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

pub mod auth_commands;
pub mod commands;
pub mod models;

pub struct DbConnection(pub Mutex<Connection>);
pub struct AppDataDir(pub PathBuf);
pub struct CurrentUser(pub Mutex<Option<models::UserSession>>);

pub fn init_db(app_handle: &tauri::AppHandle) -> SqliteResult<(Connection, PathBuf)> {
    let app_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            eprintln!("Failed to get app data directory: {:?}", e);
            // Fallback to current directory
            std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
        }
    };
    
    if let Err(e) = std::fs::create_dir_all(&app_dir) {
        eprintln!("Failed to create app data directory: {:?}", e);
    }
    
    // Create employee_images folder
    let images_dir = app_dir.join("employee_images");
    if let Err(e) = std::fs::create_dir_all(&images_dir) {
        eprintln!("Failed to create employee images directory: {:?}", e);
    }
    
    let db_path = app_dir.join("hrm_system.db");
    eprintln!("Database path: {:?}", db_path);
    
    let conn = Connection::open(&db_path)?;
    
    // Create employees table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS employees (
            epf_number TEXT PRIMARY KEY,
            name_with_initials TEXT NOT NULL,
            full_name TEXT NOT NULL,
            dob TEXT,
            police_area TEXT,
            transport_route TEXT,
            mobile_1 TEXT,
            mobile_2 TEXT,
            address TEXT,
            date_of_join TEXT,
            date_of_resign TEXT,
            working_status TEXT DEFAULT 'active',
            marital_status TEXT,
            cader TEXT,
            designation TEXT,
            allocation TEXT,
            department TEXT,
            image_path TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    
    // Create users table with permissions columns
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer',
            department_access TEXT,
            is_active INTEGER DEFAULT 1,
            can_view_employees INTEGER DEFAULT 1,
            can_add_employees INTEGER DEFAULT 0,
            can_edit_employees INTEGER DEFAULT 0,
            can_delete_employees INTEGER DEFAULT 0,
            can_manage_users INTEGER DEFAULT 0,
            can_view_all_departments INTEGER DEFAULT 0,
            can_export_data INTEGER DEFAULT 0,
            can_view_reports INTEGER DEFAULT 0,
            can_manage_settings INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_login TEXT
        )",
        [],
    )?;
    
    // Create default admin user if no users exist
    let user_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM users",
        [],
        |row| row.get(0),
    )?;
    
    if user_count == 0 {
        // Default password is "admin123" - should be changed on first login
        let default_password_hash = hash_password("admin123");
        conn.execute(
            "INSERT INTO users (username, password_hash, full_name, role, can_view_employees, can_add_employees, can_edit_employees, can_delete_employees, can_manage_users, can_view_all_departments, can_export_data, can_view_reports, can_manage_settings) 
             VALUES ('admin', ?1, 'System Administrator', 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 1)",
            [&default_password_hash],
        )?;
        eprintln!("Created default admin user (username: admin, password: admin123)");
    }
    
    // Add new columns if they don't exist (for existing databases)
    let _ = conn.execute("ALTER TABLE employees ADD COLUMN cader TEXT", []);
    let _ = conn.execute("ALTER TABLE employees ADD COLUMN designation TEXT", []);
    let _ = conn.execute("ALTER TABLE employees ADD COLUMN allocation TEXT", []);
    let _ = conn.execute("ALTER TABLE employees ADD COLUMN image_path TEXT", []);
    
    // Add permission columns to users table if they don't exist (migration)
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_view_employees INTEGER DEFAULT 1", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_add_employees INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_edit_employees INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_delete_employees INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_manage_users INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_view_all_departments INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_export_data INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_view_reports INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE users ADD COLUMN can_manage_settings INTEGER DEFAULT 0", []);
    
    // Update existing admin users to have all permissions
    let _ = conn.execute(
        "UPDATE users SET can_view_employees=1, can_add_employees=1, can_edit_employees=1, can_delete_employees=1, can_manage_users=1, can_view_all_departments=1, can_export_data=1, can_view_reports=1, can_manage_settings=1 WHERE role='admin'",
        [],
    );
    
    // Migrate job_role to designation if job_role exists
    let _ = conn.execute("UPDATE employees SET designation = job_role WHERE designation IS NULL AND job_role IS NOT NULL", []);
    
    Ok((conn, app_dir))
}

// Simple password hashing (in production, use bcrypt or argon2)
pub fn hash_password(password: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    // Add a salt for basic security
    "hrm_salt_".hash(&mut hasher);
    password.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    hash_password(password) == hash
}
