import { useState, useEffect } from "react";
import type { Employee } from "../types/employee";

interface EmployeeFormProps {
  employee: Employee | null;
  onSubmit: (employee: Employee) => void;
  onCancel: () => void;
  departments: string[];
  transportRoutes: string[];
}

const emptyEmployee: Employee = {
  epf_number: "",
  name_with_initials: "",
  full_name: "",
  dob: null,
  police_area: null,
  transport_route: null,
  mobile_1: null,
  mobile_2: null,
  address: null,
  date_of_join: null,
  date_of_resign: null,
  working_status: "active",
  marital_status: null,
  job_role: null,
  department: null,
};

function EmployeeForm({ employee, onSubmit, onCancel, departments, transportRoutes }: EmployeeFormProps) {
  const [formData, setFormData] = useState<Employee>(emptyEmployee);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDepartment, setNewDepartment] = useState("");
  const [newRoute, setNewRoute] = useState("");
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [showNewRoute, setShowNewRoute] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData(emptyEmployee);
    }
  }, [employee]);

  const handleChange = (field: keyof Employee, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.epf_number.trim()) {
      newErrors.epf_number = "EPF Number is required";
    }
    if (!formData.name_with_initials.trim()) {
      newErrors.name_with_initials = "Name with initials is required";
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleAddNewDepartment = () => {
    if (newDepartment.trim()) {
      handleChange("department", newDepartment.trim());
      setNewDepartment("");
      setShowNewDepartment(false);
    }
  };

  const handleAddNewRoute = () => {
    if (newRoute.trim()) {
      handleChange("transport_route", newRoute.trim());
      setNewRoute("");
      setShowNewRoute(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {employee ? "Edit Employee" : "Add New Employee"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* EPF Number */}
          <div>
            <label className="label">EPF Number *</label>
            <input
              type="text"
              className={`input-field ${errors.epf_number ? "border-red-500" : ""}`}
              value={formData.epf_number}
              onChange={(e) => handleChange("epf_number", e.target.value)}
              disabled={!!employee}
            />
            {errors.epf_number && <p className="text-red-500 text-sm mt-1">{errors.epf_number}</p>}
          </div>

          {/* Name with Initials */}
          <div>
            <label className="label">Name with Initials *</label>
            <input
              type="text"
              className={`input-field ${errors.name_with_initials ? "border-red-500" : ""}`}
              value={formData.name_with_initials}
              onChange={(e) => handleChange("name_with_initials", e.target.value)}
              placeholder="e.g., K.A.S. Perera"
            />
            {errors.name_with_initials && <p className="text-red-500 text-sm mt-1">{errors.name_with_initials}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              className={`input-field ${errors.full_name ? "border-red-500" : ""}`}
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
            />
            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="label">Date of Birth</label>
            <input
              type="date"
              className="input-field"
              value={formData.dob || ""}
              onChange={(e) => handleChange("dob", e.target.value)}
            />
          </div>

          {/* Date of Join */}
          <div>
            <label className="label">Date of Join</label>
            <input
              type="date"
              className="input-field"
              value={formData.date_of_join || ""}
              onChange={(e) => handleChange("date_of_join", e.target.value)}
            />
          </div>

          {/* Date of Resign */}
          <div>
            <label className="label">Date of Resign</label>
            <input
              type="date"
              className="input-field"
              value={formData.date_of_resign || ""}
              onChange={(e) => handleChange("date_of_resign", e.target.value)}
            />
          </div>

          {/* Mobile 1 */}
          <div>
            <label className="label">Mobile 1</label>
            <input
              type="tel"
              className="input-field"
              value={formData.mobile_1 || ""}
              onChange={(e) => handleChange("mobile_1", e.target.value)}
              placeholder="07X XXX XXXX"
            />
          </div>

          {/* Mobile 2 */}
          <div>
            <label className="label">Mobile 2</label>
            <input
              type="tel"
              className="input-field"
              value={formData.mobile_2 || ""}
              onChange={(e) => handleChange("mobile_2", e.target.value)}
              placeholder="07X XXX XXXX"
            />
          </div>

          {/* Police Area */}
          <div>
            <label className="label">Police Area</label>
            <input
              type="text"
              className="input-field"
              value={formData.police_area || ""}
              onChange={(e) => handleChange("police_area", e.target.value)}
            />
          </div>

          {/* Department */}
          <div>
            <label className="label">Department</label>
            {showNewDepartment ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="New department name"
                />
                <button type="button" onClick={handleAddNewDepartment} className="btn-primary">
                  Add
                </button>
                <button type="button" onClick={() => setShowNewDepartment(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  value={formData.department || ""}
                  onChange={(e) => handleChange("department", e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewDepartment(true)} className="btn-secondary">
                  +
                </button>
              </div>
            )}
          </div>

          {/* Job Role */}
          <div>
            <label className="label">Job Role</label>
            <input
              type="text"
              className="input-field"
              value={formData.job_role || ""}
              onChange={(e) => handleChange("job_role", e.target.value)}
            />
          </div>

          {/* Transport Route */}
          <div>
            <label className="label">Transport Route</label>
            {showNewRoute ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field"
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.target.value)}
                  placeholder="New route name"
                />
                <button type="button" onClick={handleAddNewRoute} className="btn-primary">
                  Add
                </button>
                <button type="button" onClick={() => setShowNewRoute(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  value={formData.transport_route || ""}
                  onChange={(e) => handleChange("transport_route", e.target.value)}
                >
                  <option value="">Select Transport Route</option>
                  {transportRoutes.map((route) => (
                    <option key={route} value={route}>{route}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewRoute(true)} className="btn-secondary">
                  +
                </button>
              </div>
            )}
          </div>

          {/* Working Status */}
          <div>
            <label className="label">Working Status</label>
            <select
              className="input-field"
              value={formData.working_status}
              onChange={(e) => handleChange("working_status", e.target.value)}
            >
              <option value="active">Active</option>
              <option value="resign">Resigned</option>
            </select>
          </div>

          {/* Marital Status */}
          <div>
            <label className="label">Marital Status</label>
            <select
              className="input-field"
              value={formData.marital_status || ""}
              onChange={(e) => handleChange("marital_status", e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          {/* Address - Full Width */}
          <div className="md:col-span-3">
            <label className="label">Address</label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {employee ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeForm;
