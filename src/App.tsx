import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AuthProvider, useAuth } from "./context/AuthContext";
import EmployeeManagement from "./components/EmployeeManagement";
import Dashboard from "./components/Dashboard";
import Sidebar, { PageType } from "./components/Sidebar";
import UpdateChecker from "./components/UpdateChecker";
import WorkInProgress from "./components/WorkInProgress";
import Footer from "./components/Footer";
import Login from "./components/Login";
import UserManagement from "./components/UserManagement";
import DatabaseBackup from "./components/DatabaseBackup";

// Developer info - Update these with your details
const DEVELOPER_NAME = "Asitha Kanchana";
const LINKEDIN_URL = "https://www.linkedin.com/in/asithakanchana";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        await invoke("init_database");
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setInitError(String(error));
      }
    };
    initDb();
  }, []);

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-4">Failed to initialize the database:</p>
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dbInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!dbInitialized ? "Initializing database..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "employees":
        return <EmployeeManagement />;
      case "jobdesk":
        return (
          <WorkInProgress 
            title="Job Desk" 
            description="Job designation and department management will be available here."
            icon="💼"
          />
        );
      case "leave":
        return (
          <WorkInProgress 
            title="Leave Management" 
            description="Employee leave requests, approvals, and leave balance tracking will be available here."
            icon="🏖️"
          />
        );
      case "attendance":
        return (
          <WorkInProgress 
            title="Attendance" 
            description="Fingerprint attendance import from Excel and daily attendance tracking will be available here."
            icon="📋"
          />
        );
      case "payroll":
        return (
          <WorkInProgress 
            title="Payroll" 
            description="Salary calculation, payslips, and payroll reports will be available here."
            icon="💰"
          />
        );
      case "admin":
        // Show User Management for users with permission, otherwise show WIP
        if (user.permissions.can_manage_users) {
          return <UserManagement />;
        }
        return (
          <WorkInProgress 
            title="Admin Panel" 
            description="You don't have permission to access user management."
            icon="🔒"
          />
        );
      case "settings":
        return (
          <WorkInProgress 
            title="Settings" 
            description="Application settings, backup/restore, and configuration options will be available here."
            icon="⚙️"
          />
        );
      case "backup":
        return <DatabaseBackup />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
        <Footer developerName={DEVELOPER_NAME} linkedinUrl={LINKEDIN_URL} />
      </div>
      <UpdateChecker />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
