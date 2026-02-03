import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import EmployeeManagement from "./components/EmployeeManagement";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import UpdateChecker from "./components/UpdateChecker";

function App() {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "employees">("dashboard");
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await invoke("init_database");
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };
    initDb();
  }, []);

  if (!dbInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 p-6 overflow-auto">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "employees" && <EmployeeManagement />}
      </main>
      <UpdateChecker />
    </div>
  );
}

export default App;
