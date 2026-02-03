use crate::models::{DashboardStats, DepartmentCount, Employee, EmployeeFilters};
use crate::DbConnection;
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
                date_of_resign, working_status, marital_status, job_role, 
                department, created_at 
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
                job_role: row.get(13)?,
                department: row.get(14)?,
                created_at: row.get(15)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(employees)
}

#[tauri::command]
pub fn create_employee(employee: Employee, db: State<'_, DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO employees (
            epf_number, name_with_initials, full_name, dob, police_area,
            transport_route, mobile_1, mobile_2, address, date_of_join,
            date_of_resign, working_status, marital_status, job_role, department
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
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
            employee.job_role,
            employee.department,
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
            marital_status = ?13, job_role = ?14, department = ?15
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
            employee.job_role,
            employee.department,
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
