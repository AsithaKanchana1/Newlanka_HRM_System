import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DashboardStats } from "../types/employee";

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_employees: 0,
    active_employees: 0,
    resigned_employees: 0,
    departments: [],
    caders: [],
    allocations: [],
    recent_joinings: 0,
    recent_resignations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await invoke<DashboardStats>("get_dashboard_stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const retentionRate = stats.total_employees > 0 
    ? Math.round((stats.active_employees / stats.total_employees) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total_employees}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Employees</p>
              <p className="text-3xl font-bold text-green-600">{stats.active_employees}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resigned Employees</p>
              <p className="text-3xl font-bold text-red-600">{stats.resigned_employees}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Retention Rate</p>
              <p className="text-3xl font-bold text-purple-600">{retentionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-xl">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">New Joinings (Last 30 Days)</p>
              <p className="text-4xl font-bold text-green-800">{stats.recent_joinings}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-100 rounded-xl">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">Resignations (Last 30 Days)</p>
              <p className="text-4xl font-bold text-red-800">{stats.recent_resignations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">By Department</h2>
          </div>
          {stats.departments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {stats.departments.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm truncate flex-1">{dept.name || "Unassigned"}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.active_employees > 0 ? (dept.count / stats.active_employees) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cader Breakdown */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">By Cader</h2>
          </div>
          {!stats.caders || stats.caders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {stats.caders.map((cader) => (
                <div key={cader.name} className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm truncate flex-1">{cader.name || "Unassigned"}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${stats.active_employees > 0 ? (cader.count / stats.active_employees) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">{cader.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Allocation Breakdown */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">By Allocation</h2>
          </div>
          {!stats.allocations || stats.allocations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {stats.allocations.map((alloc) => (
                <div key={alloc.name} className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm truncate flex-1">{alloc.name || "Unassigned"}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${stats.active_employees > 0 ? (alloc.count / stats.active_employees) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">{alloc.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-bold text-primary-600">{stats.departments.length}</p>
            <p className="text-sm text-gray-500">Departments</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-bold text-orange-600">{stats.caders?.length || 0}</p>
            <p className="text-sm text-gray-500">Cader Types</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-bold text-teal-600">{stats.allocations?.length || 0}</p>
            <p className="text-sm text-gray-500">Allocations</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <p className="text-2xl font-bold text-purple-600">
              {stats.active_employees > 0 
                ? Math.round(stats.active_employees / (stats.departments.length || 1)) 
                : 0}
            </p>
            <p className="text-sm text-gray-500">Avg per Dept</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
