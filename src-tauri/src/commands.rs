use crate::models::{DashboardStats, DepartmentCount, Employee, EmployeeFilters};
use crate::{AppDataDir, DbConnection};
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
pub fn create_employee(employee: Employee, db: State<'_, DbConnection>) -> Result<(), String> {
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
    
    Ok(())
}

#[tauri::command]
pub fn update_employee(employee: Employee, db: State<'_, DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
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
    
    Ok(())
}

#[tauri::command]
pub fn delete_employee(epf_number: String, db: State<'_, DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM employees WHERE epf_number = ?1", [&epf_number])
        .map_err(|e| e.to_string())?;
    
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
    let mut stmt = conn
        .prepare(
            "SELECT COALESCE(department, 'Unassigned') as dept, COUNT(*) as count 
             FROM employees 
             GROUP BY department 
             ORDER BY count DESC",
        )
        .map_err(|e| e.to_string())?;
    
    let departments = stmt
        .query_map([], |row| {
            Ok(DepartmentCount {
                name: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(DashboardStats {
        total_employees: total,
        active_employees: active,
        resigned_employees: resigned,
        departments,
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
