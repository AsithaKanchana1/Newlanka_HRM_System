import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Employee, EmployeeFilters } from "../types/employee";
import type { UserPermissions } from "../types/auth";
import { useAuth } from "../context/AuthContext";
import EmployeeForm from "./EmployeeForm";
import EmployeeTable from "./EmployeeTable";
import EmployeeProfile from "./EmployeeProfile";
import { ExportService, ExportFormat } from "../services/ExportService";

function EmployeeManagement() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedProfileEpf, setSelectedProfileEpf] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({
    epf_number: "",
    department: "",
    transport_route: "",
    working_status: "",
  });
  
  const [departments, setDepartments] = useState<string[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<string[]>([]);
  const [policeAreas, setPoliceAreas] = useState<string[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<string[]>([]);

  // Get user permissions from session
  const permissions: UserPermissions = user?.permissions || {
    can_view_employees: false,
    can_add_employees: false,
    can_edit_employees: false,
    can_delete_employees: false,
    can_manage_users: false,
    can_view_all_departments: false,
    can_export_data: false,
    can_view_reports: false,
    can_manage_settings: false,
  };

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<Employee[]>("get_employees", { filters });
      setEmployees(data);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const [depts, routes, areas, desigs, allocs] = await Promise.all([
        invoke<string[]>("get_distinct_departments"),
        invoke<string[]>("get_distinct_transport_routes"),
        invoke<string[]>("get_distinct_police_areas"),
        invoke<string[]>("get_distinct_designations"),
        invoke<string[]>("get_distinct_allocations"),
      ]);
      setDepartments(depts);
      setTransportRoutes(routes);
      setPoliceAreas(areas);
      setDesignations(desigs);
      setAllocations(allocs);
    } catch (error) {
      console.error("Failed to load filter options:", error);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadFilterOptions();
  }, [loadEmployees]);

  const handleAddNew = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (epfNumber: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    
    try {
      await invoke("delete_employee", { epfNumber });
      loadEmployees();
      loadFilterOptions();
    } catch (error) {
      console.error("Failed to delete employee:", error);
      alert("Failed to delete employee");
    }
  };

  const handleOpenProfile = (epfNumber: string) => {
    setSelectedProfileEpf(epfNumber);
  };

  const handleCloseProfile = () => {
    setSelectedProfileEpf(null);
  };

  const handleEditFromProfile = () => {
    const employee = employees.find(e => e.epf_number === selectedProfileEpf);
    if (employee) {
      setSelectedProfileEpf(null);
      handleEdit(employee);
    }
  };

  const handleFormSubmit = async (employee: Employee) => {
    try {
      if (editingEmployee) {
        await invoke("update_employee", { employee });
      } else {
        await invoke("create_employee", { employee });
      }
      setShowForm(false);
      setEditingEmployee(null);
      loadEmployees();
      loadFilterOptions();
    } catch (error) {
      console.error("Failed to save employee:", error);
      alert(`Failed to save employee: ${error}`);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleFilterChange = (key: keyof EmployeeFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      epf_number: "",
      department: "",
      transport_route: "",
      working_status: "",
    });
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      // Fetch all employees for export (no filters)
      const allEmployees = await invoke<Employee[]>("get_employees", { 
        filters: { epf_number: "", department: "", transport_route: "", working_status: "" } 
      });
      
      switch (format) {
        case 'excel':
          ExportService.exportToExcel(allEmployees, 'employees');
          break;
        case 'csv':
          ExportService.exportToCSV(allEmployees, 'employees');
          break;
        case 'pdf':
          ExportService.exportToPDF(allEmployees, 'Employees Report');
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
        <div className="flex items-center gap-3">
          {/* Export Button */}
          {permissions.can_export_data && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="btn-secondary flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </>
                )}
              </button>
              
              {/* Export Menu Dropdown */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Export to Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Export to CSV
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Export to PDF
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Add Employee Button */}
          {permissions.can_add_employees && (
            <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Employee
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          departments={departments}
          transportRoutes={transportRoutes}
          policeAreas={policeAreas}
          designations={designations}
          allocations={allocations}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Search & Filters</h2>
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700">
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">EPF Number</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by EPF..."
                  value={filters.epf_number}
                  onChange={(e) => handleFilterChange("epf_number", e.target.value)}
                />
              </div>
              
              <div>
                <label className="label">Department</label>
                <select
                  className="input-field"
                  value={filters.department}
                  onChange={(e) => handleFilterChange("department", e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Transport Route</label>
                <select
                  className="input-field"
                  value={filters.transport_route}
                  onChange={(e) => handleFilterChange("transport_route", e.target.value)}
                >
                  <option value="">All Routes</option>
                  {transportRoutes.map((route) => (
                    <option key={route} value={route}>{route}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Working Status</label>
                <select
                  className="input-field"
                  value={filters.working_status}
                  onChange={(e) => handleFilterChange("working_status", e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="resign">Resigned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <EmployeeTable
            employees={employees}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpen={handleOpenProfile}
            permissions={permissions}
          />
        </>
      )}

      {/* Employee Profile Modal */}
      {selectedProfileEpf && (
        <EmployeeProfile
          epfNumber={selectedProfileEpf}
          onClose={handleCloseProfile}
          onEdit={handleEditFromProfile}
          canEdit={permissions.can_edit_employees}
          canExport={permissions.can_export_data}
        />
      )}
    </div>
  );
}

export default EmployeeManagement;
