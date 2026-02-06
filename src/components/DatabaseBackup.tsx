import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { useAuth } from "../context/AuthContext";

interface DatabaseInfo {
  path: string;
  size_bytes: number;
  size_formatted: string;
  employee_count: number;
  user_count: number;
}

function DatabaseBackup() {
  const { user } = useAuth();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      const info = await invoke<DatabaseInfo>("get_database_info");
      setDbInfo(info);
    } catch (error) {
      console.error("Failed to load database info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setMessage(null);

      // Get current date for filename
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const defaultName = `hrm_backup_${dateStr}.db`;

      // Open save dialog
      const filePath = await save({
        defaultPath: defaultName,
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
        title: "Export Database Backup",
      });

      if (!filePath) {
        setExporting(false);
        return;
      }

      const result = await invoke<string>("export_database", {
        destinationPath: filePath,
      });

      setMessage({ type: "success", text: result });
    } catch (error) {
      setMessage({ type: "error", text: String(error) });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setMessage(null);

      // Open file dialog
      const filePath = await open({
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
        title: "Import Database Backup",
        multiple: false,
      });

      if (!filePath) {
        setImporting(false);
        return;
      }

      const result = await invoke<string>("import_database", {
        sourcePath: filePath,
      });

      setMessage({ type: "success", text: result });
    } catch (error) {
      setMessage({ type: "error", text: String(error) });
    } finally {
      setImporting(false);
    }
  };

  // Check permission
  if (!user?.permissions.can_backup_database) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          You don't have permission to access database backup features.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Database Management</h2>

      {/* Database Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          Database Information
        </h3>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : dbInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Database Location</p>
              <p className="text-sm font-mono text-gray-700 break-all mt-1">{dbInfo.path}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">File Size</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">{dbInfo.size_formatted}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Total Employees</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{dbInfo.employee_count}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Total Users</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{dbInfo.user_count}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Unable to load database information</p>
        )}
      </div>

      {/* Backup & Restore Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Backup & Restore
        </h3>

        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Export Database</h4>
                <p className="text-sm text-gray-500">Create a backup copy of your database</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Export the current database to share with other systems or keep as a backup.
              This includes all employees, users, and settings.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full btn-primary py-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Export Backup
                </>
              )}
            </button>
          </div>

          {/* Import Section */}
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Import Database</h4>
                <p className="text-sm text-gray-500">Restore from a backup file</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Import a database backup from another system. This will replace all current data.
              <span className="text-orange-600 font-medium"> A backup of current data will be created automatically.</span>
            </p>
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Import Backup
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-800">Important Notes</h4>
              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                <li>After importing a database, you need to restart the application for changes to take effect.</li>
                <li>The import will replace ALL current data including users and employees.</li>
                <li>A backup of your current database is automatically created before import.</li>
                <li>Make sure to export a backup before importing to avoid data loss.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatabaseBackup;
