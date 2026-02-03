use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub epf_number: String,
    pub name_with_initials: String,
    pub full_name: String,
    pub dob: Option<String>,
    pub police_area: Option<String>,
    pub transport_route: Option<String>,
    pub mobile_1: Option<String>,
    pub mobile_2: Option<String>,
    pub address: Option<String>,
    pub date_of_join: Option<String>,
    pub date_of_resign: Option<String>,
    pub working_status: String,
    pub marital_status: Option<String>,
    pub job_role: Option<String>,
    pub department: Option<String>,
    #[serde(skip_deserializing)]
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmployeeFilters {
    pub epf_number: String,
    pub department: String,
    pub transport_route: String,
    pub working_status: String,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_employees: i32,
    pub active_employees: i32,
    pub resigned_employees: i32,
    pub departments: Vec<DepartmentCount>,
}

#[derive(Debug, Serialize)]
pub struct DepartmentCount {
    pub name: String,
    pub count: i32,
}
