/**
 * Authentication Service
 * Handles all API calls related to user authentication and user management
 */

import { invoke } from "@tauri-apps/api/core";
import type { 
  UserSession, 
  UserInfo, 
  LoginRequest, 
  CreateUserRequest,
  UpdateUserRequest 
} from "../models/User";

export class AuthService {
  /**
   * Login with username and password
   */
  static async login(credentials: LoginRequest): Promise<UserSession> {
    try {
      return await invoke<UserSession>("login", { request: credentials });
    } catch (error) {
      console.error("AuthService.login error:", error);
      throw new Error(`${error}`);
    }
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    try {
      await invoke("logout");
    } catch (error) {
      console.error("AuthService.logout error:", error);
      throw new Error(`Failed to logout: ${error}`);
    }
  }

  /**
   * Get current logged in user
   */
  static async getCurrentUser(): Promise<UserSession | null> {
    try {
      return await invoke<UserSession | null>("get_current_user");
    } catch (error) {
      console.error("AuthService.getCurrentUser error:", error);
      return null;
    }
  }

  /**
   * Create a new user (admin only)
   */
  static async createUser(request: CreateUserRequest): Promise<void> {
    try {
      await invoke("create_user", { request });
    } catch (error) {
      console.error("AuthService.createUser error:", error);
      throw new Error(`${error}`);
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<UserInfo[]> {
    try {
      return await invoke<UserInfo[]>("get_all_users");
    } catch (error) {
      console.error("AuthService.getAllUsers error:", error);
      throw new Error(`Failed to fetch users: ${error}`);
    }
  }

  /**
   * Update a user (admin only)
   */
  static async updateUser(request: UpdateUserRequest): Promise<void> {
    try {
      await invoke("update_user", { request });
    } catch (error) {
      console.error("AuthService.updateUser error:", error);
      throw new Error(`${error}`);
    }
  }

  /**
   * Delete a user (admin only)
   */
  static async deleteUser(userId: number): Promise<void> {
    try {
      await invoke("delete_user", { userId });
    } catch (error) {
      console.error("AuthService.deleteUser error:", error);
      throw new Error(`${error}`);
    }
  }

  /**
   * Reset user password (admin only)
   */
  static async resetPassword(userId: number, newPassword: string): Promise<void> {
    try {
      await invoke("reset_user_password", { userId, newPassword });
    } catch (error) {
      console.error("AuthService.resetPassword error:", error);
      throw new Error(`${error}`);
    }
  }

  /**
   * Change own password
   */
  static async changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await invoke("change_own_password", { currentPassword, newPassword });
    } catch (error) {
      console.error("AuthService.changeOwnPassword error:", error);
      throw new Error(`${error}`);
    }
  }
}
