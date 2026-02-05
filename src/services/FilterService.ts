/**
 * Filter Service
 * Handles fetching filter options for dropdowns
 */

import { invoke } from "@tauri-apps/api/core";
import type { FilterOptions } from "../models/Common";

export class FilterService {
  /**
   * Get all filter options at once
   */
  static async getAllFilterOptions(): Promise<FilterOptions> {
    try {
      const [departments, transportRoutes, policeAreas, designations, allocations] = 
        await Promise.all([
          this.getDepartments(),
          this.getTransportRoutes(),
          this.getPoliceAreas(),
          this.getDesignations(),
          this.getAllocations(),
        ]);

      return {
        departments,
        transportRoutes,
        policeAreas,
        designations,
        allocations,
      };
    } catch (error) {
      console.error("FilterService.getAllFilterOptions error:", error);
      throw new Error(`Failed to fetch filter options: ${error}`);
    }
  }

  /**
   * Get distinct departments
   */
  static async getDepartments(): Promise<string[]> {
    try {
      return await invoke<string[]>("get_distinct_departments");
    } catch (error) {
      console.error("FilterService.getDepartments error:", error);
      return [];
    }
  }

  /**
   * Get distinct transport routes
   */
  static async getTransportRoutes(): Promise<string[]> {
    try {
      return await invoke<string[]>("get_distinct_transport_routes");
    } catch (error) {
      console.error("FilterService.getTransportRoutes error:", error);
      return [];
    }
  }

  /**
   * Get distinct police areas
   */
  static async getPoliceAreas(): Promise<string[]> {
    try {
      return await invoke<string[]>("get_distinct_police_areas");
    } catch (error) {
      console.error("FilterService.getPoliceAreas error:", error);
      return [];
    }
  }

  /**
   * Get distinct designations
   */
  static async getDesignations(): Promise<string[]> {
    try {
      return await invoke<string[]>("get_distinct_designations");
    } catch (error) {
      console.error("FilterService.getDesignations error:", error);
      return [];
    }
  }

  /**
   * Get distinct allocations
   */
  static async getAllocations(): Promise<string[]> {
    try {
      return await invoke<string[]>("get_distinct_allocations");
    } catch (error) {
      console.error("FilterService.getAllocations error:", error);
      return [];
    }
  }
}
