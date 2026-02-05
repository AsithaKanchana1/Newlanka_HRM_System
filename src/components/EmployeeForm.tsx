import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Employee } from "../types/employee";
import CustomDatePicker from "./CustomDatePicker";

interface EmployeeFormProps {
  employee: Employee | null;
  onSubmit: (employee: Employee) => void;
  onCancel: () => void;
  departments: string[];
  transportRoutes: string[];
  policeAreas: string[];
  designations: string[];
  allocations: string[];
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
  cader: null,
  designation: null,
  allocation: null,
  department: null,
  image_path: null,
};

// Fixed cader options
const CADER_OPTIONS = ["Direct Cader", "Indirect Cader", "Other"];

function EmployeeForm({ employee, onSubmit, onCancel, departments, transportRoutes, policeAreas, designations, allocations }: EmployeeFormProps) {
  const [formData, setFormData] = useState<Employee>(emptyEmployee);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDepartment, setNewDepartment] = useState("");
  const [newRoute, setNewRoute] = useState("");
  const [newPoliceArea, setNewPoliceArea] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newAllocation, setNewAllocation] = useState("");
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [showNewRoute, setShowNewRoute] = useState(false);
  const [showNewPoliceArea, setShowNewPoliceArea] = useState(false);
  const [showNewDesignation, setShowNewDesignation] = useState(false);
  const [showNewAllocation, setShowNewAllocation] = useState(false);
  
  // Image handling
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local lists that include newly added items
  const [localDepartments, setLocalDepartments] = useState<string[]>([]);
  const [localRoutes, setLocalRoutes] = useState<string[]>([]);
  const [localPoliceAreas, setLocalPoliceAreas] = useState<string[]>([]);
  const [localDesignations, setLocalDesignations] = useState<string[]>([]);
  const [localAllocations, setLocalAllocations] = useState<string[]>([]);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
      // Load existing image if available
      if (employee.image_path) {
        loadEmployeeImage(employee.image_path);
      } else {
        setImagePreview(null);
        setImageData(null);
      }
    } else {
      setFormData(emptyEmployee);
      setImagePreview(null);
      setImageData(null);
    }
  }, [employee]);

  const loadEmployeeImage = async (imagePath: string) => {
    try {
      const imageDataUrl = await invoke<string>("get_employee_image", { imagePath });
      setImagePreview(imageDataUrl);
    } catch (error) {
      console.error("Failed to load employee image:", error);
      setImagePreview(null);
    }
  };

  // Initialize local lists from props
  useEffect(() => {
    setLocalDepartments(departments);
  }, [departments]);

  useEffect(() => {
    setLocalRoutes(transportRoutes);
  }, [transportRoutes]);

  useEffect(() => {
    setLocalPoliceAreas(policeAreas);
  }, [policeAreas]);

  useEffect(() => {
    setLocalDesignations(designations);
  }, [designations]);

  useEffect(() => {
    setLocalAllocations(allocations);
  }, [allocations]);

  const handleChange = (field: keyof Employee, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: "Please select an image file" }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Image size must be less than 5MB" }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageData(result);
        setErrors((prev) => ({ ...prev, image: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    // Image is mandatory for new employees
    if (!employee && !imageData) {
      newErrors.image = "Employee photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        let updatedFormData = { ...formData };
        
        // Save image if new image data exists
        if (imageData) {
          const imagePath = await invoke<string>("save_employee_image", {
            epfNumber: formData.epf_number,
            imageData: imageData,
          });
          updatedFormData.image_path = imagePath;
        }
        
        onSubmit(updatedFormData);
      } catch (error) {
        console.error("Failed to save image:", error);
        alert("Failed to save employee image");
      }
    }
  };

  const handleAddNewDepartment = () => {
    if (newDepartment.trim()) {
      const trimmed = newDepartment.trim();
      // Add to local list if not already present
      if (!localDepartments.includes(trimmed)) {
        setLocalDepartments((prev) => [...prev, trimmed]);
      }
      handleChange("department", trimmed);
      setNewDepartment("");
      setShowNewDepartment(false);
    }
  };

  const handleAddNewRoute = () => {
    if (newRoute.trim()) {
      const trimmed = newRoute.trim();
      // Add to local list if not already present
      if (!localRoutes.includes(trimmed)) {
        setLocalRoutes((prev) => [...prev, trimmed]);
      }
      handleChange("transport_route", trimmed);
      setNewRoute("");
      setShowNewRoute(false);
    }
  };

  const handleAddNewPoliceArea = () => {
    if (newPoliceArea.trim()) {
      const trimmed = newPoliceArea.trim();
      // Add to local list if not already present
      if (!localPoliceAreas.includes(trimmed)) {
        setLocalPoliceAreas((prev) => [...prev, trimmed]);
      }
      handleChange("police_area", trimmed);
      setNewPoliceArea("");
      setShowNewPoliceArea(false);
    }
  };

  const handleAddNewDesignation = () => {
    if (newDesignation.trim()) {
      const trimmed = newDesignation.trim();
      // Add to local list if not already present
      if (!localDesignations.includes(trimmed)) {
        setLocalDesignations((prev) => [...prev, trimmed]);
      }
      handleChange("designation", trimmed);
      setNewDesignation("");
      setShowNewDesignation(false);
    }
  };

  const handleAddNewAllocation = () => {
    if (newAllocation.trim()) {
      const trimmed = newAllocation.trim();
      // Add to local list if not already present
      if (!localAllocations.includes(trimmed)) {
        setLocalAllocations((prev) => [...prev, trimmed]);
      }
      handleChange("allocation", trimmed);
      setNewAllocation("");
      setShowNewAllocation(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {employee ? "Edit Employee" : "Add New Employee"}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Employee Photo Section */}
        <div className="mb-8 flex flex-col items-center">
          <label className="label mb-2">Employee Photo *</label>
          <div className="relative">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Employee"
                  className="w-40 h-40 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-40 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors ${
                  errors.image ? "border-red-500" : "border-gray-300"
                }`}
              >
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-gray-500">Click to upload</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          {imagePreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-primary-600 hover:text-primary-800"
            >
              Change photo
            </button>
          )}
          {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
        </div>

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
            <CustomDatePicker
              value={formData.dob}
              onChange={(value) => handleChange("dob", value)}
              placeholder="Select date of birth"
            />
          </div>

          {/* Date of Join */}
          <div>
            <label className="label">Date of Join</label>
            <CustomDatePicker
              value={formData.date_of_join}
              onChange={(value) => handleChange("date_of_join", value)}
              placeholder="Select join date"
            />
          </div>

          {/* Date of Resign */}
          <div>
            <label className="label">Date of Resign</label>
            <CustomDatePicker
              value={formData.date_of_resign}
              onChange={(value) => handleChange("date_of_resign", value)}
              placeholder="Select resign date"
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
            {showNewPoliceArea ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field"
                  value={newPoliceArea}
                  onChange={(e) => setNewPoliceArea(e.target.value)}
                  placeholder="New police area name"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNewPoliceArea())}
                />
                <button type="button" onClick={handleAddNewPoliceArea} className="btn-primary">
                  Add
                </button>
                <button type="button" onClick={() => setShowNewPoliceArea(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  value={formData.police_area || ""}
                  onChange={(e) => handleChange("police_area", e.target.value)}
                >
                  <option value="">Select Police Area</option>
                  {localPoliceAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewPoliceArea(true)} className="btn-secondary">
                  +
                </button>
              </div>
            )}
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
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNewDepartment())}
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
                  {localDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewDepartment(true)} className="btn-secondary">
                  +
                </button>
              </div>
            )}
          </div>

          {/* Cader */}
          <div>
            <label className="label">Cader</label>
            <select
              className="input-field"
              value={formData.cader || ""}
              onChange={(e) => handleChange("cader", e.target.value)}
            >
              <option value="">Select Cader</option>
              {CADER_OPTIONS.map((cader) => (
                <option key={cader} value={cader}>{cader}</option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div>
            <label className="label">Designation</label>
            {showNewDesignation ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="New designation"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNewDesignation())}
                />
                <button type="button" onClick={handleAddNewDesignation} className="btn-primary">
                  Add
                </button>
                <button type="button" onClick={() => setShowNewDesignation(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  value={formData.designation || ""}
                  onChange={(e) => handleChange("designation", e.target.value)}
                >
                  <option value="">Select Designation</option>
                  {localDesignations.map((designation) => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewDesignation(true)} className="btn-secondary">
                  +
                </button>
              </div>
            )}
          </div>

          {/* Allocation */}
          <div>
            <label className="label">Allocation</label>
            {showNewAllocation ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field"
                  value={newAllocation}
                  onChange={(e) => setNewAllocation(e.target.value)}
                  placeholder="New allocation (e.g., Line 1)"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNewAllocation())}
                />
                <button type="button" onClick={handleAddNewAllocation} className="btn-primary">
                  Add
                </button>
                <button type="button" onClick={() => setShowNewAllocation(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  value={formData.allocation || ""}
                  onChange={(e) => handleChange("allocation", e.target.value)}
                >
                  <option value="">Select Allocation</option>
                  {localAllocations.map((allocation) => (
                    <option key={allocation} value={allocation}>{allocation}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewAllocation(true)} className="btn-secondary">
                  +
                </button>
              </div>
            )}
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
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNewRoute())}
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
                  {localRoutes.map((route) => (
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
