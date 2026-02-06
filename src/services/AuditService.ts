/**
 * Audit Service
 * Handles all API calls related to audit log operations
 * MVC Architecture: Service layer for audit data access
 */

import { invoke } from "@tauri-apps/api/core";
import type { 
  AuditLogFilters, 
  AuditLogResult, 
  AuditLogSummary 
} from "../types/employee";

export class AuditService {
  /**
   * Get audit logs with optional filters and pagination
   */
  static async getLogs(filters: AuditLogFilters): Promise<AuditLogResult> {
    try {
      return await invoke<AuditLogResult>("get_audit_logs", { filters });
    } catch (error) {
      console.error("AuditService.getLogs error:", error);
      throw new Error(`Failed to fetch audit logs: ${error}`);
    }
  }

  /**
   * Get audit log summary statistics
   */
  static async getSummary(): Promise<AuditLogSummary> {
    try {
      return await invoke<AuditLogSummary>("get_audit_log_summary");
    } catch (error) {
      console.error("AuditService.getSummary error:", error);
      throw new Error(`Failed to fetch audit summary: ${error}`);
    }
  }

  /**
   * Create a new audit log entry (for frontend-triggered actions)
   */
  static async createLog(
    action: string,
    entityType: string,
    entityId: string | null,
    details: string | null
  ): Promise<void> {
    try {
      await invoke("create_audit_log", { action, entityType, entityId, details });
    } catch (error) {
      console.error("AuditService.createLog error:", error);
      throw new Error(`Failed to create audit log: ${error}`);
    }
  }
}
