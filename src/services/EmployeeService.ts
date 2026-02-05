/**
 * Employee Service
 * Handles all API calls related to employee operations
 */

import { invoke } from "@tauri-apps/api/core";
import type { Employee, EmployeeFilters } from "../types/employee";

// Form data type for creating/updating employees
export interface EmployeeFormData extends Omit<Employee, 'created_at'> {
  imageBase64?: string | null;
}

export class EmployeeService {
  /**
   * Get all employees with optional filters
   */
  static async getAll(filters?: EmployeeFilters): Promise<Employee[]> {
    try {
      return await invoke<Employee[]>("get_employees", { filters: filters || {} });
    } catch (error) {
      console.error("EmployeeService.getAll error:", error);
      throw new Error(`Failed to fetch employees: ${error}`);
    }
  }

  /**
   * Get a single employee by EPF number
   */
  static async getByEpf(epfNumber: string): Promise<Employee> {
    try {
      return await invoke<Employee>("get_employee_by_epf", { epfNumber });
    } catch (error) {
      console.error("EmployeeService.getByEpf error:", error);
      throw new Error(`Failed to fetch employee: ${error}`);
    }
  }

  /**
   * Create a new employee
   */
  static async create(employee: EmployeeFormData): Promise<void> {
    try {
      await invoke("create_employee", { employee });
    } catch (error) {
      console.error("EmployeeService.create error:", error);
      throw new Error(`Failed to create employee: ${error}`);
    }
  }

  /**
   * Update an existing employee
   */
  static async update(employee: EmployeeFormData): Promise<void> {
    try {
      await invoke("update_employee", { employee });
    } catch (error) {
      console.error("EmployeeService.update error:", error);
      throw new Error(`Failed to update employee: ${error}`);
    }
  }

  /**
   * Delete an employee
   */
  static async delete(epfNumber: string): Promise<void> {
    try {
      await invoke("delete_employee", { epfNumber });
    } catch (error) {
      console.error("EmployeeService.delete error:", error);
      throw new Error(`Failed to delete employee: ${error}`);
    }
  }

  /**
   * Get employee image as base64 data URL
   */
  static async getImage(imagePath: string): Promise<string | null> {
    try {
      return await invoke<string>("get_employee_image", { imagePath });
    } catch (error) {
      console.error("EmployeeService.getImage error:", error);
      return null;
    }
  }

  /**
   * Get employee count statistics
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    resigned: number;
    byDepartment: Record<string, number>;
  }> {
    try {
      const employees = await this.getAll();
      const active = employees.filter(e => e.working_status === "active").length;
      const resigned = employees.filter(e => e.working_status === "resign").length;
      
      const byDepartment: Record<string, number> = {};
      employees.forEach(e => {
        const dept = e.department || "Unassigned";
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
      });

      return {
        total: employees.length,
        active,
        resigned,
        byDepartment,
      };
    } catch (error) {
      console.error("EmployeeService.getStats error:", error);
      throw new Error(`Failed to fetch statistics: ${error}`);
    }
  }
}
