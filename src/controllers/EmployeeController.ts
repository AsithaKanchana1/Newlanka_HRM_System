/**
 * Employee Controller
 * Handles business logic for employee operations
 */

import { EmployeeService, EmployeeFormData } from "../services/EmployeeService";
import { FilterService } from "../services/FilterService";
import type { Employee, EmployeeFilters } from "../types/employee";

// Filter options structure
export interface FilterOptions {
  departments: string[];
  transportRoutes: string[];
  policeAreas: string[];
  designations: string[];
  allocations: string[];
}

export class EmployeeController {
  /**
   * Load employees with filters
   */
  static async loadEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    return await EmployeeService.getAll(filters);
  }

  /**
   * Load single employee by EPF
   */
  static async loadEmployee(epfNumber: string): Promise<Employee> {
    return await EmployeeService.getByEpf(epfNumber);
  }

  /**
   * Load filter options for dropdowns
   */
  static async loadFilterOptions(): Promise<FilterOptions> {
    return await FilterService.getAllFilterOptions();
  }

  /**
   * Save employee (create or update)
   */
  static async saveEmployee(
    employee: EmployeeFormData, 
    isEditing: boolean
  ): Promise<void> {
    if (isEditing) {
      await EmployeeService.update(employee);
    } else {
      await EmployeeService.create(employee);
    }
  }

  /**
   * Delete employee
   */
  static async deleteEmployee(epfNumber: string): Promise<void> {
    await EmployeeService.delete(epfNumber);
  }

  /**
   * Load employee image
   */
  static async loadEmployeeImage(imagePath: string | null): Promise<string | null> {
    if (!imagePath) return null;
    return await EmployeeService.getImage(imagePath);
  }

  /**
   * Get employee statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    resigned: number;
    byDepartment: Record<string, number>;
  }> {
    return await EmployeeService.getStats();
  }

  /**
   * Validate employee data before saving
   */
  static validateEmployee(employee: EmployeeFormData): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];

    if (!employee.epf_number?.trim()) {
      errors.push("EPF Number is required");
    }

    if (!employee.name_with_initials?.trim()) {
      errors.push("Name with Initials is required");
    }

    if (!employee.full_name?.trim()) {
      errors.push("Full Name is required");
    }

    // Validate date formats if provided
    if (employee.dob && !this.isValidDate(employee.dob)) {
      errors.push("Invalid Date of Birth format");
    }

    if (employee.date_of_join && !this.isValidDate(employee.date_of_join)) {
      errors.push("Invalid Date of Joining format");
    }

    if (employee.date_of_resign && !this.isValidDate(employee.date_of_resign)) {
      errors.push("Invalid Date of Resignation format");
    }

    // Validate mobile numbers
    if (employee.mobile_1 && !this.isValidMobile(employee.mobile_1)) {
      errors.push("Invalid Mobile 1 format (should be 10 digits)");
    }

    if (employee.mobile_2 && !this.isValidMobile(employee.mobile_2)) {
      errors.push("Invalid Mobile 2 format (should be 10 digits)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate date string
   */
  private static isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  /**
   * Validate mobile number
   */
  private static isValidMobile(mobile: string): boolean {
    // Sri Lankan mobile format: 10 digits starting with 0
    const mobileRegex = /^0[0-9]{9}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ""));
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dob: string | null): number | null {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Calculate service duration
   */
  static calculateServiceDuration(joinDate: string | null): string {
    if (!joinDate) return "-";
    const join = new Date(joinDate);
    const today = new Date();
    const years = today.getFullYear() - join.getFullYear();
    const months = today.getMonth() - join.getMonth();
    
    if (months < 0) {
      return `${years - 1} years, ${12 + months} months`;
    }
    return `${years} years, ${months} months`;
  }

  /**
   * Format date for display
   */
  static formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }
}
