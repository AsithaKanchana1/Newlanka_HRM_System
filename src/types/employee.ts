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
  job_role: string | null;
  department: string | null;
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
}
