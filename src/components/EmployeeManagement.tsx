import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Employee, EmployeeFilters } from "../types/employee";
import EmployeeForm from "./EmployeeForm";
import EmployeeTable from "./EmployeeTable";

function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({
    epf_number: "",
    department: "",
    transport_route: "",
    working_status: "",
  });
  
  const [departments, setDepartments] = useState<string[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<string[]>([]);

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
      const [depts, routes] = await Promise.all([
        invoke<string[]>("get_distinct_departments"),
        invoke<string[]>("get_distinct_transport_routes"),
      ]);
      setDepartments(depts);
      setTransportRoutes(routes);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
        <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Employee
        </button>
      </div>

      {showForm ? (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          departments={departments}
          transportRoutes={transportRoutes}
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
          />
        </>
      )}
    </div>
  );
}

export default EmployeeManagement;
