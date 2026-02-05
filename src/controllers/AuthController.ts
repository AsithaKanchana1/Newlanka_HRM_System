/**
 * Authentication Controller
 * Handles business logic for authentication and user management
 */

import { AuthService } from "../services/AuthService";
import type { 
  UserSession, 
  UserInfo, 
  LoginRequest, 
  CreateUserRequest,
  UpdateUserRequest,
  UserPermissions 
} from "../models/User";
import { createDefaultPermissions, getPermissionsByRole, ROLES } from "../models/User";

export class AuthController {
  /**
   * Perform login
   */
  static async login(username: string, password: string): Promise<UserSession> {
    const credentials: LoginRequest = { username, password };
    return await AuthService.login(credentials);
  }

  /**
   * Perform logout
   */
  static async logout(): Promise<void> {
    await AuthService.logout();
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<UserSession | null> {
    return await AuthService.getCurrentUser();
  }

  /**
   * Load all users (admin only)
   */
  static async loadUsers(): Promise<UserInfo[]> {
    return await AuthService.getAllUsers();
  }

  /**
   * Create new user with custom permissions
   */
  static async createUser(
    username: string,
    password: string,
    fullName: string,
    role: string,
    departmentAccess: string | null,
    permissions: UserPermissions
  ): Promise<void> {
    const request: CreateUserRequest = {
      username,
      password,
      full_name: fullName,
      role,
      department_access: departmentAccess,
      permissions,
    };
    await AuthService.createUser(request);
  }

  /**
   * Update existing user
   */
  static async updateUser(
    id: number,
    username: string,
    fullName: string,
    role: string,
    departmentAccess: string | null,
    isActive: boolean,
    permissions: UserPermissions
  ): Promise<void> {
    const request: UpdateUserRequest = {
      id,
      username,
      full_name: fullName,
      role,
      department_access: departmentAccess,
      is_active: isActive,
      permissions,
    };
    await AuthService.updateUser(request);
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: number): Promise<void> {
    await AuthService.deleteUser(userId);
  }

  /**
   * Reset user password
   */
  static async resetUserPassword(userId: number, newPassword: string): Promise<void> {
    await AuthService.resetPassword(userId, newPassword);
  }

  /**
   * Change own password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await AuthService.changeOwnPassword(currentPassword, newPassword);
  }

  /**
   * Validate user form data
   */
  static validateUserForm(
    username: string,
    password: string | null,
    fullName: string,
    isNew: boolean
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!username?.trim()) {
      errors.push("Username is required");
    } else if (username.length < 3) {
      errors.push("Username must be at least 3 characters");
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push("Username can only contain letters, numbers, and underscores");
    }

    if (isNew && !password) {
      errors.push("Password is required for new users");
    } else if (password && password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }

    if (!fullName?.trim()) {
      errors.push("Full Name is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default permissions for a role
   */
  static getDefaultPermissions(role: string): UserPermissions {
    return getPermissionsByRole(role);
  }

  /**
   * Create empty permissions object
   */
  static createEmptyPermissions(): UserPermissions {
    return createDefaultPermissions();
  }

  /**
   * Get available roles
   */
  static getRoles() {
    return ROLES;
  }

  /**
   * Get role label
   */
  static getRoleLabel(roleValue: string): string {
    const role = ROLES.find(r => r.value === roleValue);
    return role?.label || roleValue;
  }

  /**
   * Get role badge color class
   */
  static getRoleBadgeColor(role: string): string {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "hr_manager": return "bg-blue-100 text-blue-800";
      case "hr_staff": return "bg-green-100 text-green-800";
      case "viewer": return "bg-gray-100 text-gray-800";
      case "custom": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(
    session: UserSession | null, 
    permission: keyof UserPermissions
  ): boolean {
    if (!session) return false;
    return session.permissions[permission] === true;
  }

  /**
   * Check if user can access a feature
   */
  static canAccess(session: UserSession | null, feature: string): boolean {
    if (!session) return false;
    
    switch (feature) {
      case "employees":
        return session.permissions.can_view_employees;
      case "export":
        return session.permissions.can_export_data;
      case "admin":
        return session.permissions.can_manage_users;
      case "reports":
        return session.permissions.can_view_reports;
      case "settings":
        return session.permissions.can_manage_settings;
      default:
        return false;
    }
  }
}
