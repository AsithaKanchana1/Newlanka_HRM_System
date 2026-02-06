export interface Employee {
  epf_number: string;
  name_with_initials: string;
  full_name: string;
  dob: string | null;
  police_area: string | null;
  transport_route: string | null;
  mobile_1: string | null;
  mobile_2: string | null;
  address: string | null;
  date_of_join: string | null;
  date_of_resign: string | null;
  working_status: string;
  marital_status: string | null;
  cader: string | null;
  designation: string | null;
  allocation: string | null;
  department: string | null;
  image_path: string | null;
  created_at?: string;
}

export interface EmployeeFilters {
  epf_number: string;
  department: string;
  transport_route: string;
  working_status: string;
}

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  resigned_employees: number;
  departments: { name: string; count: number }[];
  caders: { name: string; count: number }[];
  allocations: { name: string; count: number }[];
  recent_joinings: number;
  recent_resignations: number;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  details: string | null;
  created_at: string | null;
}

export interface AuditLogFilters {
  username: string;
  action: string;
  entity_type: string;
  start_date: string;
  end_date: string;
  limit: number;
  offset: number;
}

export interface AuditLogResult {
  logs: AuditLog[];
  total_count: number;
}

export interface AuditLogSummary {
  total_logs: number;
  today_logs: number;
  week_logs: number;
  action_breakdown: { action: string; count: number }[];
  active_users: { username: string; count: number }[];
}
