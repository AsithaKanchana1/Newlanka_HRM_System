/**
 * Export Controller
 * Handles business logic for data export operations
 */

import { ExportService, ExportFormat } from "../services/ExportService";
import { EmployeeService } from "../services/EmployeeService";
import type { Employee, EmployeeFilters } from "../types/employee";

export class ExportController {
  /**
   * Export employees to Excel
   */
  static async exportEmployeesToExcel(
    filters?: EmployeeFilters,
    filename: string = "employees"
  ): Promise<void> {
    const employees = await EmployeeService.getAll(filters);
    await ExportService.exportToExcel(employees, filename);
  }

  /**
   * Export employees to CSV
   */
  static async exportEmployeesToCSV(
    filters?: EmployeeFilters,
    filename: string = "employees"
  ): Promise<void> {
    const employees = await EmployeeService.getAll(filters);
    await ExportService.exportToCSV(employees, filename);
  }

  /**
   * Export employees to PDF (print)
   */
  static async exportEmployeesToPDF(
    filters?: EmployeeFilters,
    title: string = "Employee Report"
  ): Promise<void> {
    const employees = await EmployeeService.getAll(filters);
    await ExportService.exportToPDF(employees, title);
  }

  /**
   * Export with format selection
   */
  static async exportEmployees(
    format: ExportFormat,
    filters?: EmployeeFilters,
    options?: { filename?: string; title?: string }
  ): Promise<void> {
    switch (format) {
      case "excel":
        await this.exportEmployeesToExcel(filters, options?.filename);
        break;
      case "csv":
        await this.exportEmployeesToCSV(filters, options?.filename);
        break;
      case "pdf":
        await this.exportEmployeesToPDF(filters, options?.title);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export specific employees
   */
  static async exportSelectedEmployees(
    employees: Employee[],
    format: ExportFormat,
    options?: { filename?: string; title?: string }
  ): Promise<void> {
    switch (format) {
      case "excel":
        await ExportService.exportToExcel(employees, options?.filename || "selected_employees");
        break;
      case "csv":
        await ExportService.exportToCSV(employees, options?.filename || "selected_employees");
        break;
      case "pdf":
        await ExportService.exportToPDF(employees, options?.title || "Selected Employees Report");
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get export format options
   */
  static getExportFormats(): Array<{ value: ExportFormat; label: string; icon: string }> {
    return [
      { value: "excel", label: "Excel (.xlsx)", icon: "📊" },
      { value: "csv", label: "CSV (.csv)", icon: "📄" },
      { value: "pdf", label: "PDF (Print)", icon: "🖨️" },
    ];
  }
}
