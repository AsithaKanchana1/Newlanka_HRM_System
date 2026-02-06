import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-shell";
import type { Employee } from "../types/employee";

interface EmployeeProfileProps {
  epfNumber: string;
  onClose: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  canExport?: boolean;
}

function EmployeeProfile({ epfNumber, onClose, onEdit, canEdit = false, canExport = true }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEmployee();
  }, [epfNumber]);

  const loadEmployee = async () => {
    try {
      const data = await invoke<Employee>("get_employee_by_epf", { epfNumber });
      setEmployee(data);
      
      if (data.image_path) {
        try {
          const image = await invoke<string>("get_employee_image", { imagePath: data.image_path });
          setImageUrl(image);
        } catch {
          setImageUrl(null);
        }
      }
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "-";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateServiceYears = (joinDate: string | null) => {
    if (!joinDate) return "-";
    const join = new Date(joinDate);
    const today = new Date();
    const years = today.getFullYear() - join.getFullYear();
    const months = today.getMonth() - join.getMonth();
    
    if (months < 0) {
      return `${years - 1} years, ${12 + months} months`;
    }
    return `${years} years, ${months} months`;
  };

  const handleExportPDF = async () => {
    if (!employee) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Profile - ${employee.epf_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .photo {
            width: 150px;
            height: 150px;
            border-radius: 10px;
            object-fit: cover;
            border: 3px solid #e5e7eb;
            margin-right: 30px;
          }
          .photo-placeholder {
            width: 150px;
            height: 150px;
            border-radius: 10px;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 48px;
            margin-right: 30px;
          }
          .title-section h1 { 
            font-size: 28px; 
            color: #1e40af;
            margin-bottom: 5px;
          }
          .title-section h2 { 
            font-size: 18px; 
            color: #6b7280;
            font-weight: normal;
          }
          .epf-badge {
            background: #2563eb;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            display: inline-block;
            margin-top: 10px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item label {
            font-size: 12px;
            color: #6b7280;
            display: block;
            margin-bottom: 3px;
          }
          .info-item span {
            font-size: 14px;
            color: #1f2937;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-active { background: #dcfce7; color: #166534; }
          .status-inactive { background: #fee2e2; color: #991b1b; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          .company-name { font-weight: 600; color: #1e40af; }
          @media print {
            body { padding: 20px; }
            .header { break-inside: avoid; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${imageUrl 
            ? `<img src="${imageUrl}" class="photo" alt="Employee Photo">`
            : `<div class="photo-placeholder">👤</div>`
          }
          <div class="title-section">
            <h1>${employee.full_name}</h1>
            <h2>${employee.name_with_initials}</h2>
            <span class="epf-badge">EPF: ${employee.epf_number}</span>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Employment Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Department</label>
              <span>${employee.department || '-'}</span>
            </div>
            <div class="info-item">
              <label>Cader</label>
              <span>${employee.cader || '-'}</span>
            </div>
            <div class="info-item">
              <label>Designation</label>
              <span>${employee.designation || '-'}</span>
            </div>
            <div class="info-item">
              <label>Allocation</label>
              <span>${employee.allocation || '-'}</span>
            </div>
            <div class="info-item">
              <label>Date of Joining</label>
              <span>${formatDate(employee.date_of_join)}</span>
            </div>
            <div class="info-item">
              <label>Service Duration</label>
              <span>${calculateServiceYears(employee.date_of_join)}</span>
            </div>
            <div class="info-item">
              <label>Working Status</label>
              <span class="status-badge ${employee.working_status === 'active' ? 'status-active' : 'status-inactive'}">
                ${employee.working_status === 'active' ? 'Active' : 'Resigned'}
              </span>
            </div>
            ${employee.date_of_resign ? `
            <div class="info-item">
              <label>Date of Resignation</label>
              <span>${formatDate(employee.date_of_resign)}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Personal Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Date of Birth</label>
              <span>${formatDate(employee.dob)}</span>
            </div>
            <div class="info-item">
              <label>Age</label>
              <span>${calculateAge(employee.dob)} years</span>
            </div>
            <div class="info-item">
              <label>Marital Status</label>
              <span>${employee.marital_status ? employee.marital_status.charAt(0).toUpperCase() + employee.marital_status.slice(1) : '-'}</span>
            </div>
            <div class="info-item">
              <label>Police Area</label>
              <span>${employee.police_area || '-'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Contact Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Mobile 1</label>
              <span>${employee.mobile_1 || '-'}</span>
            </div>
            <div class="info-item">
              <label>Mobile 2</label>
              <span>${employee.mobile_2 || '-'}</span>
            </div>
            <div class="info-item">
              <label>Transport Route</label>
              <span>${employee.transport_route || '-'}</span>
            </div>
            <div class="info-item" style="grid-column: span 2;">
              <label>Address</label>
              <span>${employee.address || '-'}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p class="company-name">New Lanka Clothing (Pvt) Ltd</p>
          <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;

    try {
      // Use Tauri dialog to save HTML file
      const filePath = await save({
        defaultPath: `Employee_${employee.epf_number}_${new Date().toISOString().split('T')[0]}.html`,
        filters: [{ name: "HTML Files", extensions: ["html"] }],
      });
      
      if (filePath) {
        await writeTextFile(filePath, htmlContent);
        // Open the file in browser for printing
        await open(filePath);
      }
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export profile");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-red-500 mb-4">{error || "Employee not found"}</p>
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div ref={profileRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 rounded-t-2xl">
          <div className="flex items-start gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={employee.full_name}
                  className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <svg className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Title Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{employee.full_name}</h1>
              <p className="text-primary-200 mt-1">{employee.name_with_initials}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  EPF: {employee.epf_number}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  employee.working_status === 'active' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {employee.working_status === 'active' ? 'Active' : 'Resigned'}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Employment Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Department" value={employee.department} />
              <InfoItem label="Cader" value={employee.cader} />
              <InfoItem label="Designation" value={employee.designation} />
              <InfoItem label="Allocation" value={employee.allocation} />
              <InfoItem label="Date of Joining" value={formatDate(employee.date_of_join)} />
              <InfoItem label="Service Duration" value={calculateServiceYears(employee.date_of_join)} />
              {employee.date_of_resign && (
                <InfoItem label="Date of Resignation" value={formatDate(employee.date_of_resign)} />
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Date of Birth" value={formatDate(employee.dob)} />
              <InfoItem label="Age" value={`${calculateAge(employee.dob)} years`} />
              <InfoItem 
                label="Marital Status" 
                value={employee.marital_status ? employee.marital_status.charAt(0).toUpperCase() + employee.marital_status.slice(1) : null} 
              />
              <InfoItem label="Police Area" value={employee.police_area} />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Contact Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Mobile 1" value={employee.mobile_1} />
              <InfoItem label="Mobile 2" value={employee.mobile_2} />
              <InfoItem label="Transport Route" value={employee.transport_route} />
            </div>
            <div className="mt-4">
              <InfoItem label="Address" value={employee.address} fullWidth />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Added: {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : '-'}
          </div>
          <div className="flex gap-3">
            {canExport && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            )}
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit()}
                className="btn-primary"
              >
                Edit Employee
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Item Component
function InfoItem({ label, value, fullWidth = false }: { label: string; value: string | null; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
    </div>
  );
}

export default EmployeeProfile;
