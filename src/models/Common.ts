/**
 * Common Models
 * Shared types and interfaces used across the application
 */

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Sort options
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

// Filter options for dropdowns
export interface FilterOptions {
  departments: string[];
  transportRoutes: string[];
  policeAreas: string[];
  designations: string[];
  allocations: string[];
}

// Export format options
export type ExportFormat = "excel" | "pdf" | "csv";

// Export request
export interface ExportRequest {
  format: ExportFormat;
  filters?: Record<string, string>;
  columns?: string[];
}

// Dashboard statistics
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  resignedEmployees: number;
  departmentCounts: Record<string, number>;
  recentJoins: number;
  recentResigns: number;
}

// Notification types
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Error state
export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}
