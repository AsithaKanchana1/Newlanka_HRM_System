use crate::models::{AuditLog, AuditLogFilters, AuditLogResult, DashboardStats, DepartmentCount, Employee, EmployeeFilters};
use crate::{AppDataDir, CurrentUser, DbConnection};
use base64::{engine::general_purpose, Engine as _};
use std::fs;
use std::path::Path;
use tauri::State;

#[tauri::command]
pub fn init_database() -> Result<(), String> {
    // Database is initialized in main.rs, this is just a confirmation
    Ok(())
}

#[tauri::command]
pub fn get_employees(
    filters: EmployeeFilters,
    db: State<'_, DbConnection>,
) -> Result<Vec<Employee>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut sql = String::from(
        "SELECT epf_number, name_with_initials, full_name, dob, police_area, 
                transport_route, mobile_1, mobile_2, address, date_of_join, 
                date_of_resign, working_status, marital_status, cader,
                designation, allocation, department, image_path, created_at 
         FROM employees WHERE 1=1"
    );
    let mut params: Vec<String> = Vec::new();
    
    if !filters.epf_number.is_empty() {
        sql.push_str(" AND epf_number LIKE ?");
        params.push(format!("%{}%", filters.epf_number));
    }
    if !filters.department.is_empty() {
        sql.push_str(" AND department = ?");
        params.push(filters.department);
    }
    if !filters.transport_route.is_empty() {
        sql.push_str(" AND transport_route = ?");
        params.push(filters.transport_route);
    }
    if !filters.working_status.is_empty() {
        sql.push_str(" AND working_status = ?");
        params.push(filters.working_status);
    }
    
    sql.push_str(" ORDER BY epf_number ASC");
    
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params
        .iter()
        .map(|p| p as &dyn rusqlite::ToSql)
        .collect();
    
    let employees = stmt
        .query_map(params_refs.as_slice(), |row| {
            Ok(Employee {
                epf_number: row.get(0)?,
                name_with_initials: row.get(1)?,
                full_name: row.get(2)?,
                dob: row.get(3)?,
                police_area: row.get(4)?,
                transport_route: row.get(5)?,
                mobile_1: row.get(6)?,
                mobile_2: row.get(7)?,
                address: row.get(8)?,
                date_of_join: row.get(9)?,
                date_of_resign: row.get(10)?,
                working_status: row.get(11)?,
                marital_status: row.get(12)?,
                cader: row.get(13)?,
                designation: row.get(14)?,
                allocation: row.get(15)?,
                department: row.get(16)?,
                image_path: row.get(17)?,
                created_at: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(employees)
}

#[tauri::command]
pub fn get_employee_by_epf(
    epf_number: String,
    db: State<'_, DbConnection>,
) -> Result<Employee, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.query_row(
        "SELECT epf_number, name_with_initials, full_name, dob, police_area, 
                transport_route, mobile_1, mobile_2, address, date_of_join, 
                date_of_resign, working_status, marital_status, cader,
                designation, allocation, department, image_path, created_at 
         FROM employees WHERE epf_number = ?1",
        [&epf_number],
        |row| {
            Ok(Employee {
                epf_number: row.get(0)?,
                name_with_initials: row.get(1)?,
                full_name: row.get(2)?,
                dob: row.get(3)?,
                police_area: row.get(4)?,
                transport_route: row.get(5)?,
                mobile_1: row.get(6)?,
                mobile_2: row.get(7)?,
                address: row.get(8)?,
                date_of_join: row.get(9)?,
                date_of_resign: row.get(10)?,
                working_status: row.get(11)?,
                marital_status: row.get(12)?,
                cader: row.get(13)?,
                designation: row.get(14)?,
                allocation: row.get(15)?,
                department: row.get(16)?,
                image_path: row.get(17)?,
                created_at: row.get(18)?,
            })
        },
    )
    .map_err(|e| format!("Employee not found: {}", e))
}

#[tauri::command]
pub fn create_employee(
    employee: Employee,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO employees (
            epf_number, name_with_initials, full_name, dob, police_area,
            transport_route, mobile_1, mobile_2, address, date_of_join,
            date_of_resign, working_status, marital_status, cader,
            designation, allocation, department, image_path
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
        rusqlite::params![
            employee.epf_number,
            employee.name_with_initials,
            employee.full_name,
            employee.dob,
            employee.police_area,
            employee.transport_route,
            employee.mobile_1,
            employee.mobile_2,
            employee.address,
            employee.date_of_join,
            employee.date_of_resign,
            employee.working_status,
            employee.marital_status,
            employee.cader,
            employee.designation,
            employee.allocation,
            employee.department,
            employee.image_path,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    // Log audit action
    let user_guard = current_user.0.lock().map_err(|e| e.to_string())?;
    let (user_id, username) = if let Some(ref user) = *user_guard {
        (Some(user.user_id), user.username.clone())
    } else {
        (None, "system".to_string())
    };
    
    let new_value = serde_json::to_string(&employee).ok();
    log_audit_action(
        &conn,
        user_id,
        &username,
        "CREATE",
        "EMPLOYEE",
        Some(&employee.epf_number),
        None,
        new_value.as_deref(),
        Some(&format!("Created employee: {} ({})", employee.name_with_initials, employee.epf_number)),
    );
    
    Ok(())
}

#[tauri::command]
pub fn update_employee(
    employee: Employee,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Get old employee data for audit log
    let old_employee: Option<Employee> = conn.query_row(
        "SELECT epf_number, name_with_initials, full_name, dob, police_area, 
                transport_route, mobile_1, mobile_2, address, date_of_join, 
                date_of_resign, working_status, marital_status, cader,
                designation, allocation, department, image_path, created_at 
         FROM employees WHERE epf_number = ?1",
        [&employee.epf_number],
        |row| {
            Ok(Employee {
                epf_number: row.get(0)?,
                name_with_initials: row.get(1)?,
                full_name: row.get(2)?,
                dob: row.get(3)?,
                police_area: row.get(4)?,
                transport_route: row.get(5)?,
                mobile_1: row.get(6)?,
                mobile_2: row.get(7)?,
                address: row.get(8)?,
                date_of_join: row.get(9)?,
                date_of_resign: row.get(10)?,
                working_status: row.get(11)?,
                marital_status: row.get(12)?,
                cader: row.get(13)?,
                designation: row.get(14)?,
                allocation: row.get(15)?,
                department: row.get(16)?,
                image_path: row.get(17)?,
                created_at: row.get(18)?,
            })
        },
    ).ok();
    
    conn.execute(
        "UPDATE employees SET 
            name_with_initials = ?2, full_name = ?3, dob = ?4, police_area = ?5,
            transport_route = ?6, mobile_1 = ?7, mobile_2 = ?8, address = ?9,
            date_of_join = ?10, date_of_resign = ?11, working_status = ?12,
            marital_status = ?13, cader = ?14, designation = ?15, allocation = ?16,
            department = ?17, image_path = ?18
         WHERE epf_number = ?1",
        rusqlite::params![
            employee.epf_number,
            employee.name_with_initials,
            employee.full_name,
            employee.dob,
            employee.police_area,
            employee.transport_route,
            employee.mobile_1,
            employee.mobile_2,
            employee.address,
            employee.date_of_join,
            employee.date_of_resign,
            employee.working_status,
            employee.marital_status,
            employee.cader,
            employee.designation,
            employee.allocation,
            employee.department,
            employee.image_path,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    // Log audit action
    let user_guard = current_user.0.lock().map_err(|e| e.to_string())?;
    let (user_id, username) = if let Some(ref user) = *user_guard {
        (Some(user.user_id), user.username.clone())
    } else {
        (None, "system".to_string())
    };
    
    let old_value = old_employee.as_ref().and_then(|e| serde_json::to_string(e).ok());
    let new_value = serde_json::to_string(&employee).ok();
    log_audit_action(
        &conn,
        user_id,
        &username,
        "UPDATE",
        "EMPLOYEE",
        Some(&employee.epf_number),
        old_value.as_deref(),
        new_value.as_deref(),
        Some(&format!("Updated employee: {} ({})", employee.name_with_initials, employee.epf_number)),
    );
    
    Ok(())
}

#[tauri::command]
pub fn delete_employee(
    epf_number: String,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Get employee data for audit log before deletion
    let old_employee: Option<Employee> = conn.query_row(
        "SELECT epf_number, name_with_initials, full_name, dob, police_area, 
                transport_route, mobile_1, mobile_2, address, date_of_join, 
                date_of_resign, working_status, marital_status, cader,
                designation, allocation, department, image_path, created_at 
         FROM employees WHERE epf_number = ?1",
        [&epf_number],
        |row| {
            Ok(Employee {
                epf_number: row.get(0)?,
                name_with_initials: row.get(1)?,
                full_name: row.get(2)?,
                dob: row.get(3)?,
                police_area: row.get(4)?,
                transport_route: row.get(5)?,
                mobile_1: row.get(6)?,
                mobile_2: row.get(7)?,
                address: row.get(8)?,
                date_of_join: row.get(9)?,
                date_of_resign: row.get(10)?,
                working_status: row.get(11)?,
                marital_status: row.get(12)?,
                cader: row.get(13)?,
                designation: row.get(14)?,
                allocation: row.get(15)?,
                department: row.get(16)?,
                image_path: row.get(17)?,
                created_at: row.get(18)?,
            })
        },
    ).ok();
    
    conn.execute("DELETE FROM employees WHERE epf_number = ?1", [&epf_number])
        .map_err(|e| e.to_string())?;
    
    // Log audit action
    let user_guard = current_user.0.lock().map_err(|e| e.to_string())?;
    let (user_id, username) = if let Some(ref user) = *user_guard {
        (Some(user.user_id), user.username.clone())
    } else {
        (None, "system".to_string())
    };
    
    let old_value = old_employee.as_ref().and_then(|e| serde_json::to_string(e).ok());
    let employee_name = old_employee.as_ref().map(|e| e.name_with_initials.clone()).unwrap_or_default();
    log_audit_action(
        &conn,
        user_id,
        &username,
        "DELETE",
        "EMPLOYEE",
        Some(&epf_number),
        old_value.as_deref(),
        None,
        Some(&format!("Deleted employee: {} ({})", employee_name, epf_number)),
    );
    
    Ok(())
}

#[tauri::command]
pub fn get_distinct_departments(db: State<'_, DbConnection>) -> Result<Vec<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != '' ORDER BY department")
        .map_err(|e| e.to_string())?;
    
    let departments = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(departments)
}

#[tauri::command]
pub fn get_distinct_transport_routes(db: State<'_, DbConnection>) -> Result<Vec<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT DISTINCT transport_route FROM employees WHERE transport_route IS NOT NULL AND transport_route != '' ORDER BY transport_route")
        .map_err(|e| e.to_string())?;
    
    let routes = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(routes)
}

#[tauri::command]
pub fn get_distinct_police_areas(db: State<'_, DbConnection>) -> Result<Vec<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT DISTINCT police_area FROM employees WHERE police_area IS NOT NULL AND police_area != '' ORDER BY police_area")
        .map_err(|e| e.to_string())?;
    
    let areas = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(areas)
}

#[tauri::command]
pub fn get_distinct_designations(db: State<'_, DbConnection>) -> Result<Vec<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT DISTINCT designation FROM employees WHERE designation IS NOT NULL AND designation != '' ORDER BY designation")
        .map_err(|e| e.to_string())?;
    
    let designations = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(designations)
}

#[tauri::command]
pub fn get_distinct_allocations(db: State<'_, DbConnection>) -> Result<Vec<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT DISTINCT allocation FROM employees WHERE allocation IS NOT NULL AND allocation != '' ORDER BY allocation")
        .map_err(|e| e.to_string())?;
    
    let allocations = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(allocations)
}

#[tauri::command]
pub fn get_dashboard_stats(db: State<'_, DbConnection>) -> Result<DashboardStats, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Total employees
    let total: i32 = conn
        .query_row("SELECT COUNT(*) FROM employees", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    // Active employees
    let active: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM employees WHERE working_status = 'active'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    // Resigned employees
    let resigned: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM employees WHERE working_status = 'resign'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    // Departments breakdown
    let mut dept_stmt = conn
        .prepare(
            "SELECT COALESCE(department, 'Unassigned') as dept, COUNT(*) as count 
             FROM employees 
             WHERE working_status = 'active'
             GROUP BY department 
             ORDER BY count DESC",
        )
        .map_err(|e| e.to_string())?;
    
    let departments = dept_stmt
        .query_map([], |row| {
            Ok(DepartmentCount {
                name: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    // Caders breakdown
    let mut cader_stmt = conn
        .prepare(
            "SELECT COALESCE(cader, 'Unassigned') as cader, COUNT(*) as count 
             FROM employees 
             WHERE working_status = 'active'
             GROUP BY cader 
             ORDER BY count DESC",
        )
        .map_err(|e| e.to_string())?;
    
    let caders = cader_stmt
        .query_map([], |row| {
            Ok(DepartmentCount {
                name: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    // Allocations breakdown
    let mut alloc_stmt = conn
        .prepare(
            "SELECT COALESCE(allocation, 'Unassigned') as allocation, COUNT(*) as count 
             FROM employees 
             WHERE working_status = 'active'
             GROUP BY allocation 
             ORDER BY count DESC",
        )
        .map_err(|e| e.to_string())?;
    
    let allocations = alloc_stmt
        .query_map([], |row| {
            Ok(DepartmentCount {
                name: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    // Recent joinings (last 30 days)
    let recent_joinings: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM employees WHERE date_of_join >= date('now', '-30 days')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    // Recent resignations (last 30 days)
    let recent_resignations: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM employees WHERE date_of_resign >= date('now', '-30 days')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    Ok(DashboardStats {
        total_employees: total,
        active_employees: active,
        resigned_employees: resigned,
        departments,
        caders,
        allocations,
        recent_joinings,
        recent_resignations,
    })
}

#[tauri::command]
pub fn save_employee_image(
    epf_number: String,
    image_data: String,
    app_data_dir: State<'_, AppDataDir>,
) -> Result<String, String> {
    // Create employee folder: employee_images/<epf_number>/
    let employee_folder = app_data_dir.0.join("employee_images").join(&epf_number);
    fs::create_dir_all(&employee_folder).map_err(|e| format!("Failed to create folder: {}", e))?;
    
    // Decode base64 image data
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    let base64_data = if image_data.contains(',') {
        image_data.split(',').nth(1).unwrap_or(&image_data)
    } else {
        &image_data
    };
    
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;
    
    // Determine image format from data URL or default to jpg
    let extension = if image_data.contains("image/png") {
        "png"
    } else {
        "jpg"
    };
    
    // Save image file
    let image_filename = format!("photo.{}", extension);
    let image_path = employee_folder.join(&image_filename);
    
    fs::write(&image_path, image_bytes).map_err(|e| format!("Failed to save image: {}", e))?;
    
    // Return the relative path to store in database
    let relative_path = format!("employee_images/{}/{}", epf_number, image_filename);
    Ok(relative_path)
}

#[tauri::command]
pub fn get_employee_image(
    image_path: String,
    app_data_dir: State<'_, AppDataDir>,
) -> Result<String, String> {
    let full_path = app_data_dir.0.join(&image_path);
    
    if !Path::new(&full_path).exists() {
        return Err("Image not found".to_string());
    }
    
    let image_bytes = fs::read(&full_path).map_err(|e| format!("Failed to read image: {}", e))?;
    
    // Determine MIME type from extension
    let mime_type = if image_path.ends_with(".png") {
        "image/png"
    } else {
        "image/jpeg"
    };
    
    // Return as base64 data URL
    let base64_data = general_purpose::STANDARD.encode(&image_bytes);
    Ok(format!("data:{};base64,{}", mime_type, base64_data))
}

#[tauri::command]
pub fn save_binary_file(
    file_path: String,
    data: Vec<u8>,
) -> Result<(), String> {
    fs::write(&file_path, data).map_err(|e| format!("Failed to save file: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn export_database(
    destination_path: String,
    app_data_dir: State<'_, AppDataDir>,
) -> Result<String, String> {
    let db_path = app_data_dir.0.join("hrm_system.db");
    
    if !db_path.exists() {
        return Err("Database file not found".to_string());
    }
    
    // Copy database file to destination
    fs::copy(&db_path, &destination_path)
        .map_err(|e| format!("Failed to export database: {}", e))?;
    
    Ok(format!("Database exported successfully to: {}", destination_path))
}

#[tauri::command]
pub fn import_database(
    source_path: String,
    app_data_dir: State<'_, AppDataDir>,
    db: State<'_, DbConnection>,
) -> Result<String, String> {
    let source = Path::new(&source_path);
    
    if !source.exists() {
        return Err("Source database file not found".to_string());
    }
    
    // Validate it's a valid SQLite database
    let source_conn = rusqlite::Connection::open(&source_path)
        .map_err(|e| format!("Invalid database file: {}", e))?;
    
    // Check if it has the required tables
    let has_employees: Result<i32, _> = source_conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='employees'",
        [],
        |row| row.get(0),
    );
    
    let has_users: Result<i32, _> = source_conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users'",
        [],
        |row| row.get(0),
    );
    
    if has_employees.unwrap_or(0) == 0 || has_users.unwrap_or(0) == 0 {
        return Err("Invalid HRM database: missing required tables".to_string());
    }
    
    drop(source_conn);
    
    // Create backup of current database first
    let db_path = app_data_dir.0.join("hrm_system.db");
    let backup_path = app_data_dir.0.join("hrm_system_backup.db");
    
    if db_path.exists() {
        fs::copy(&db_path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
    }
    
    // Close current connection by acquiring and dropping the lock
    // Note: In a real scenario, we'd need to restart the app
    {
        let _conn = db.0.lock().map_err(|e| e.to_string())?;
        // Connection will be dropped at end of scope
    }
    
    // Copy the source database to app data directory
    fs::copy(&source_path, &db_path)
        .map_err(|e| format!("Failed to import database: {}", e))?;
    
    Ok("Database imported successfully. Please restart the application for changes to take effect.".to_string())
}

#[tauri::command]
pub fn get_database_info(
    app_data_dir: State<'_, AppDataDir>,
    db: State<'_, DbConnection>,
) -> Result<serde_json::Value, String> {
    let db_path = app_data_dir.0.join("hrm_system.db");
    
    let file_size = if db_path.exists() {
        fs::metadata(&db_path)
            .map(|m| m.len())
            .unwrap_or(0)
    } else {
        0
    };
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let employee_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM employees", [], |row| row.get(0))
        .unwrap_or(0);
    
    let user_count: i32 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .unwrap_or(0);
    
    Ok(serde_json::json!({
        "path": db_path.to_string_lossy(),
        "size_bytes": file_size,
        "size_formatted": format_file_size(file_size),
        "employee_count": employee_count,
        "user_count": user_count
    }))
}

fn format_file_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;
    
    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} bytes", bytes)
    }
}

// Audit Logging Functions
pub fn log_audit_action(
    db: &rusqlite::Connection,
    user_id: Option<i32>,
    username: &str,
    action: &str,
    entity_type: &str,
    entity_id: Option<&str>,
    old_value: Option<&str>,
    new_value: Option<&str>,
    details: Option<&str>,
) {
    let _ = db.execute(
        "INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, old_value, new_value, details)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            user_id,
            username,
            action,
            entity_type,
            entity_id,
            old_value,
            new_value,
            details,
        ],
    );
}

#[tauri::command]
pub fn create_audit_log(
    action: String,
    entity_type: String,
    entity_id: Option<String>,
    old_value: Option<String>,
    new_value: Option<String>,
    details: Option<String>,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let user_guard = current_user.0.lock().map_err(|e| e.to_string())?;
    
    let (user_id, username) = if let Some(ref user) = *user_guard {
        (Some(user.user_id), user.username.clone())
    } else {
        (None, "system".to_string())
    };
    
    log_audit_action(
        &conn,
        user_id,
        &username,
        &action,
        &entity_type,
        entity_id.as_deref(),
        old_value.as_deref(),
        new_value.as_deref(),
        details.as_deref(),
    );
    
    Ok(())
}

#[tauri::command]
pub fn get_audit_logs(
    filters: AuditLogFilters,
    db: State<'_, DbConnection>,
) -> Result<AuditLogResult, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut sql = String::from(
        "SELECT id, user_id, username, action, entity_type, entity_id, old_value, new_value, details, created_at 
         FROM audit_logs WHERE 1=1"
    );
    let mut count_sql = String::from("SELECT COUNT(*) FROM audit_logs WHERE 1=1");
    let mut params: Vec<String> = Vec::new();
    
    if !filters.username.is_empty() {
        sql.push_str(" AND username LIKE ?");
        count_sql.push_str(" AND username LIKE ?");
        params.push(format!("%{}%", filters.username));
    }
    if !filters.action.is_empty() {
        sql.push_str(" AND action = ?");
        count_sql.push_str(" AND action = ?");
        params.push(filters.action);
    }
    if !filters.entity_type.is_empty() {
        sql.push_str(" AND entity_type = ?");
        count_sql.push_str(" AND entity_type = ?");
        params.push(filters.entity_type);
    }
    if !filters.start_date.is_empty() {
        sql.push_str(" AND date(created_at) >= date(?)");
        count_sql.push_str(" AND date(created_at) >= date(?)");
        params.push(filters.start_date);
    }
    if !filters.end_date.is_empty() {
        sql.push_str(" AND date(created_at) <= date(?)");
        count_sql.push_str(" AND date(created_at) <= date(?)");
        params.push(filters.end_date);
    }
    
    sql.push_str(" ORDER BY created_at DESC");
    sql.push_str(&format!(" LIMIT {} OFFSET {}", filters.limit, filters.offset));
    
    let params_refs: Vec<&dyn rusqlite::ToSql> = params
        .iter()
        .map(|p| p as &dyn rusqlite::ToSql)
        .collect();
    
    // Get total count
    let mut count_stmt = conn.prepare(&count_sql).map_err(|e| e.to_string())?;
    let total_count: i32 = count_stmt
        .query_row(params_refs.as_slice(), |row| row.get(0))
        .unwrap_or(0);
    
    // Get logs
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    
    let logs = stmt
        .query_map(params_refs.as_slice(), |row| {
            Ok(AuditLog {
                id: row.get(0)?,
                user_id: row.get(1)?,
                username: row.get(2)?,
                action: row.get(3)?,
                entity_type: row.get(4)?,
                entity_id: row.get(5)?,
                old_value: row.get(6)?,
                new_value: row.get(7)?,
                details: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(AuditLogResult { logs, total_count })
}

#[tauri::command]
pub fn get_audit_log_summary(
    db: State<'_, DbConnection>,
) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Total logs
    let total: i32 = conn
        .query_row("SELECT COUNT(*) FROM audit_logs", [], |row| row.get(0))
        .unwrap_or(0);
    
    // Today's logs
    let today: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM audit_logs WHERE date(created_at) = date('now', 'localtime')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    // This week's logs
    let this_week: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM audit_logs WHERE date(created_at) >= date('now', '-7 days')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    // Actions breakdown
    let mut action_stmt = conn
        .prepare(
            "SELECT action, COUNT(*) as count FROM audit_logs 
             GROUP BY action ORDER BY count DESC LIMIT 10",
        )
        .map_err(|e| e.to_string())?;
    
    let actions: Vec<(String, i32)> = action_stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    // Recent activity by users
    let mut user_stmt = conn
        .prepare(
            "SELECT username, COUNT(*) as count FROM audit_logs 
             WHERE date(created_at) >= date('now', '-7 days')
             GROUP BY username ORDER BY count DESC LIMIT 5",
        )
        .map_err(|e| e.to_string())?;
    
    let active_users: Vec<(String, i32)> = user_stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "total_logs": total,
        "today_logs": today,
        "week_logs": this_week,
        "action_breakdown": actions.into_iter().map(|(action, count)| {
            serde_json::json!({ "action": action, "count": count })
        }).collect::<Vec<_>>(),
        "active_users": active_users.into_iter().map(|(user, count)| {
            serde_json::json!({ "username": user, "count": count })
        }).collect::<Vec<_>>(),
    }))
}
