/**
 * Audit Controller
 * Handles business logic for audit log operations
 * MVC Architecture: Controller layer coordinating between service and views
 */

import { AuditService } from "../services/AuditService";
import type { 
  AuditLogFilters, 
  AuditLogResult, 
  AuditLogSummary 
} from "../types/employee";

// Default filter values
export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  username: "",
  action: "",
  entity_type: "",
  start_date: "",
  end_date: "",
  limit: 50,
  offset: 0,
};

// Available action types for filtering
export const AUDIT_ACTION_TYPES = [
  { value: "", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "EXPORT", label: "Export" },
  { value: "IMPORT", label: "Import" },
] as const;

// Available entity types for filtering
export const AUDIT_ENTITY_TYPES = [
  { value: "", label: "All Types" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "USER", label: "User" },
  { value: "DATABASE", label: "Database" },
  { value: "SYSTEM", label: "System" },
] as const;

export class AuditController {
  /**
   * Load audit logs with filters and pagination
   */
  static async loadLogs(filters: AuditLogFilters, page: number = 0): Promise<AuditLogResult> {
    const paginatedFilters = {
      ...filters,
      offset: page * filters.limit,
    };
    return await AuditService.getLogs(paginatedFilters);
  }

  /**
   * Load audit summary statistics
   */
  static async loadSummary(): Promise<AuditLogSummary> {
    return await AuditService.getSummary();
  }

  /**
   * Calculate total pages for pagination
   */
  static calculateTotalPages(totalCount: number, pageSize: number): number {
    return Math.ceil(totalCount / pageSize);
  }

  /**
   * Log a frontend action (export, view, etc.)
   */
  static async logAction(
    action: string,
    entityType: string,
    entityId?: string | null,
    details?: string | null
  ): Promise<void> {
    await AuditService.createLog(action, entityType, entityId || null, details || null);
  }

  /**
   * Get color class for action badge
   */
  static getActionColor(action: string): string {
    const colorMap: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      LOGIN: "bg-purple-100 text-purple-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      EXPORT: "bg-yellow-100 text-yellow-800",
      IMPORT: "bg-orange-100 text-orange-800",
    };
    return colorMap[action] || "bg-gray-100 text-gray-800";
  }

  /**
   * Format date for display
   */
  static formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Reset filters to default values
   */
  static getDefaultFilters(): AuditLogFilters {
    return { ...DEFAULT_AUDIT_FILTERS };
  }
}
