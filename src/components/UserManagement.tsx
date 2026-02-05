import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "../context/AuthContext";
import type { UserInfo, CreateUserRequest, UpdateUserRequest, UserPermissions } from "../types/auth";
import { ROLES, PERMISSION_DEFINITIONS, getPermissionsByRole, getPermissionsByCategory } from "../types/auth";

// Helper function to get role label
const getRoleLabel = (role: string): string => {
  const roleInfo = ROLES.find(r => r.value === role);
  return roleInfo?.label || role;
};

// Default permissions for new users
const defaultPermissions: UserPermissions = {
  can_view_employees: true,
  can_add_employees: false,
  can_edit_employees: false,
  can_delete_employees: false,
  can_manage_users: false,
  can_view_all_departments: false,
  can_export_data: false,
  can_view_reports: false,
  can_manage_settings: false,
};

// Permission Toggle Component
interface PermissionToggleProps {
  permissionKey: keyof UserPermissions;
  permissions: UserPermissions;
  onChange: (key: keyof UserPermissions, value: boolean) => void;
  disabled?: boolean;
}

function PermissionToggle({ permissionKey, permissions, onChange, disabled }: PermissionToggleProps) {
  const definition = PERMISSION_DEFINITIONS.find(p => p.key === permissionKey);
  if (!definition) return null;
  
  return (
    <label className={`flex items-center justify-between p-3 rounded-lg border ${
      permissions[permissionKey] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}>
      <div>
        <p className="font-medium text-gray-800">{definition.label}</p>
        <p className="text-xs text-gray-500">{definition.description}</p>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={permissions[permissionKey]}
          onChange={(e) => onChange(permissionKey, e.target.checked)}
          disabled={disabled}
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          permissions[permissionKey] ? 'bg-green-500' : 'bg-gray-300'
        }`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            permissions[permissionKey] ? 'translate-x-5' : 'translate-x-0'
          }`}></div>
        </div>
      </div>
    </label>
  );
}

// Permission Section Component
interface PermissionSectionProps {
  category: string;
  permissions: UserPermissions;
  onChange: (key: keyof UserPermissions, value: boolean) => void;
  disabled?: boolean;
}

function PermissionSection({ category, permissions, onChange, disabled }: PermissionSectionProps) {
  const categoryPermissions = getPermissionsByCategory(category);
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{category}</h4>
      <div className="space-y-2">
        {categoryPermissions.map((def) => (
          <PermissionToggle
            key={def.key}
            permissionKey={def.key}
            permissions={permissions}
            onChange={onChange}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [viewingPermissions, setViewingPermissions] = useState<UserInfo | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: "",
    password: "",
    full_name: "",
    role: "viewer",
    department_access: null,
    permissions: { ...defaultPermissions },
  });
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({ ...defaultPermissions });
  const [formError, setFormError] = useState("");

  const loadUsers = async () => {
    try {
      const data = await invoke<UserInfo[]>("get_all_users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const depts = await invoke<string[]>("get_distinct_departments");
      setDepartments(depts);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    try {
      await invoke("create_user", { request: formData });
      setShowForm(false);
      setFormData({
        username: "",
        password: "",
        full_name: "",
        role: "viewer",
        department_access: null,
        permissions: { ...defaultPermissions },
      });
      loadUsers();
    } catch (error) {
      setFormError(error as string);
    }
  };

  const handleRoleChange = (role: string, isEdit: boolean = false) => {
    const rolePermissions = getPermissionsByRole(role);
    if (isEdit) {
      setEditPermissions(rolePermissions);
      if (editingUser) {
        setEditingUser({ ...editingUser, role });
      }
    } else {
      setFormData({ ...formData, role, permissions: rolePermissions });
    }
  };

  const handlePermissionChange = (key: keyof UserPermissions, value: boolean, isEdit: boolean = false) => {
    if (isEdit) {
      setEditPermissions({ ...editPermissions, [key]: value });
      // If custom permissions differ from role preset, mark as custom
      if (editingUser) {
        const rolePermissions = getPermissionsByRole(editingUser.role);
        const newPermissions = { ...editPermissions, [key]: value };
        const isCustom = JSON.stringify(newPermissions) !== JSON.stringify(rolePermissions);
        if (isCustom && editingUser.role !== 'custom') {
          setEditingUser({ ...editingUser, role: 'custom' });
        }
      }
    } else {
      const newPermissions = { ...formData.permissions!, [key]: value };
      // If custom permissions differ from role preset, mark as custom
      const rolePermissions = getPermissionsByRole(formData.role);
      const isCustom = JSON.stringify(newPermissions) !== JSON.stringify(rolePermissions);
      setFormData({
        ...formData,
        permissions: newPermissions,
        role: isCustom ? 'custom' : formData.role,
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      const request: UpdateUserRequest = {
        user_id: editingUser.id,
        full_name: editingUser.full_name,
        role: editingUser.role,
        department_access: editingUser.department_access,
        is_active: editingUser.is_active,
        permissions: editPermissions,
      };
      await invoke("update_user", { request });
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      alert(error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await invoke("delete_user", { userId });
      loadUsers();
    } catch (error) {
      alert(error);
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    
    try {
      await invoke("reset_user_password", { userId, newPassword });
      alert("Password reset successfully");
    } catch (error) {
      alert(error);
    }
  };

  if (!user?.permissions.can_manage_users) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add User
        </button>
      </div>

      {/* Create User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Create New User</h2>
            </div>
            <form onSubmit={handleCreateUser} className="flex-1 overflow-auto p-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="label">Username</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input-field"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Role (Preset)</label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  >
                    {ROLES.map(({ value, label, description }) => (
                      <option key={value} value={value}>
                        {label} - {description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a role preset, then customize permissions below
                  </p>
                </div>
              </div>
              
              {formData.role !== "admin" && (
                <div className="mb-6">
                  <label className="label">Department Access</label>
                  <select
                    className="input-field"
                    value={formData.department_access || ""}
                    onChange={(e) => setFormData({ ...formData, department_access: e.target.value || null })}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Permissions Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Custom Permissions
                </h3>
                <div className="space-y-4">
                  <PermissionSection
                    category="Employees"
                    permissions={formData.permissions!}
                    onChange={(key, value) => handlePermissionChange(key, value)}
                  />
                  <PermissionSection
                    category="Data"
                    permissions={formData.permissions!}
                    onChange={(key, value) => handlePermissionChange(key, value)}
                  />
                  <PermissionSection
                    category="Administration"
                    permissions={formData.permissions!}
                    onChange={(key, value) => handlePermissionChange(key, value)}
                  />
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={(e) => handleCreateUser(e as any)} className="btn-primary">
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Edit User: {editingUser.username}</h2>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingUser.full_name}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="label">Role (Preset)</label>
                  <select
                    className="input-field"
                    value={editingUser.role}
                    onChange={(e) => handleRoleChange(e.target.value, true)}
                    disabled={editingUser.id === user?.user_id}
                  >
                    {ROLES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">Department Access</label>
                <select
                  className="input-field"
                  value={editingUser.department_access || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, department_access: e.target.value || null })}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                  disabled={editingUser.id === user?.user_id}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Account Active</label>
              </div>
              
              {/* Permissions Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Custom Permissions
                </h3>
                <div className="space-y-4">
                  <PermissionSection
                    category="Employees"
                    permissions={editPermissions}
                    onChange={(key, value) => handlePermissionChange(key, value, true)}
                    disabled={editingUser.id === user?.user_id}
                  />
                  <PermissionSection
                    category="Data"
                    permissions={editPermissions}
                    onChange={(key, value) => handlePermissionChange(key, value, true)}
                    disabled={editingUser.id === user?.user_id}
                  />
                  <PermissionSection
                    category="Administration"
                    permissions={editPermissions}
                    onChange={(key, value) => handlePermissionChange(key, value, true)}
                    disabled={editingUser.id === user?.user_id}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleUpdateUser} className="btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Permissions Modal */}
      {viewingPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Permissions: {viewingPermissions.full_name}</h2>
              <p className="text-sm text-gray-500">Role: {getRoleLabel(viewingPermissions.role)}</p>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {viewingPermissions.permissions ? (
                <div className="space-y-4">
                  {['Employees', 'Data', 'Administration'].map(category => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">{category}</h4>
                      <div className="space-y-2">
                        {getPermissionsByCategory(category).map(def => (
                          <div key={def.key} className={`flex items-center justify-between p-2 rounded ${
                            viewingPermissions.permissions![def.key] ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <span className="text-sm">{def.label}</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              viewingPermissions.permissions![def.key] 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {viewingPermissions.permissions![def.key] ? '✓ Allowed' : '✗ Denied'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No permissions data available</p>
              )}
            </div>
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button onClick={() => setViewingPermissions(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {u.username}
                  {u.id === user?.user_id && (
                    <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">You</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{u.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    u.role === "admin" ? "bg-purple-100 text-purple-800" :
                    u.role === "hr_manager" ? "bg-blue-100 text-blue-800" :
                    u.role === "hr_staff" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {getRoleLabel(u.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.department_access || "All"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => setViewingPermissions(u)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Permissions
                  </button>
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setEditPermissions(u.permissions || getPermissionsByRole(u.role));
                    }}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    Reset Password
                  </button>
                  {u.id !== user?.user_id && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;
