/**
 * Employee Model
 * Defines the structure for employee data throughout the application
 */

export interface Employee {
  epf_number: string;
  name_with_initials: string;
  full_name: string;
  address: string | null;
  dob: string | null;
  date_of_join: string | null;
  date_of_resign: string | null;
  working_status: "active" | "resign";
  marital_status: string | null;
  mobile_1: string | null;
  mobile_2: string | null;
  department: string | null;
  cader: string | null;
  designation: string | null;
  allocation: string | null;
  transport_route: string | null;
  police_area: string | null;
  image_path: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeFilters {
  epf_number: string;
  department: string;
  transport_route: string;
  working_status: string;
}

export interface EmployeeFormData extends Omit<Employee, 'created_at' | 'updated_at'> {
  imageBase64?: string | null;
}

// Default empty employee for form initialization
export const createEmptyEmployee = (): EmployeeFormData => ({
  epf_number: "",
  name_with_initials: "",
  full_name: "",
  address: null,
  dob: null,
  date_of_join: null,
  date_of_resign: null,
  working_status: "active",
  marital_status: null,
  mobile_1: null,
  mobile_2: null,
  department: null,
  cader: null,
  designation: null,
  allocation: null,
  transport_route: null,
  police_area: null,
  image_path: null,
  imageBase64: null,
});

// Cader options for employee form
export const CADER_OPTIONS = [
  { value: "Direct", label: "Direct" },
  { value: "Indirect", label: "Indirect" },
  { value: "Staff", label: "Staff" },
] as const;

export type CaderType = typeof CADER_OPTIONS[number]["value"];
