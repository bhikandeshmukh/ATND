"use client";

import { useState, useEffect } from "react";
import AttendanceForm from "@/components/AttendanceForm";
import AttendanceTable from "@/components/AttendanceTable";
import EmployeeManagement from "@/components/EmployeeManagement";
import LeaveManagement from "@/components/LeaveManagement";
import NightDutyManagement from "@/components/NightDutyManagement";
import NightDutyRequestSection from "@/components/NightDutyRequestSection";
import LoginForm from "@/components/LoginForm";
import UserReportsView from "@/components/UserReportsView";
import AdminReportsView from "@/components/AdminReportsView";
import { AttendanceRecord } from "@/lib/types";
import UserNightDutyView from "@/components/UserNightDutyView";
import InstallPWA from "@/components/InstallPWA";
import NotificationBell from "@/components/NotificationBell";
import NotificationManagement from "@/components/NotificationManagement";
import UserNotifications from "@/components/UserNotifications";

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "user";
  name: string;
}

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"attendance" | "employees" | "reports" | "leaves" | "nightduty" | "notifications">("attendance");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/attendance");
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const handleRecordAdded = () => {
    fetchRecords();
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const isAdmin = user.role === "admin";

  return (
    <main className="min-h-screen p-2 sm:p-3 md:p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-2">
            {/* Mobile Menu Button - Left Side */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Attendance Tracker
              </h1>
            </div>
            <div className="p-2">
              <NotificationBell userId={user.id} userName={user.name} />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-600 text-center">
            Welcome, {user.name} ({user.role === "admin" ? "Administrator" : "User"})
          </p>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mb-3 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <nav className="flex flex-col">
              <button
                onClick={() => {
                  setActiveTab("attendance");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-3 text-left font-medium text-sm border-b border-gray-100 ${activeTab === "attendance"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                📋 Attendance
              </button>
              <button
                onClick={() => {
                  setActiveTab("nightduty");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-3 text-left font-medium text-sm border-b border-gray-100 ${activeTab === "nightduty"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                🌙 Night Duty
              </button>
              <button
                onClick={() => {
                  setActiveTab("leaves");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-3 text-left font-medium text-sm border-b border-gray-100 ${activeTab === "leaves"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                🏖️ Leaves
              </button>
              <button
                onClick={() => {
                  setActiveTab("reports");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-3 text-left font-medium text-sm border-b border-gray-100 ${activeTab === "reports"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                📊 {isAdmin ? "Reports" : "My Reports"}
              </button>
              <button
                onClick={() => {
                  setActiveTab("notifications");
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-3 text-left font-medium text-sm border-b border-gray-100 ${activeTab === "notifications"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                🔔 Notifications
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab("employees");
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 text-left font-medium text-sm ${activeTab === "employees"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  👥 Employees
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Desktop Tabs - Hidden on Mobile */}
        <div className="mb-3 border-b border-gray-200 hidden md:block">
          <nav className="flex justify-center space-x-4 sm:space-x-6">
            {/* Tab 1: Attendance */}
            <button
              onClick={() => setActiveTab("attendance")}
              className={`py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "attendance"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              📋 Attendance
            </button>

            {/* Tab 2: Night Duty */}
            <button
              onClick={() => setActiveTab("nightduty")}
              className={`py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "nightduty"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              🌙 Night Duty
            </button>

            {/* Tab 3: Leaves */}
            <button
              onClick={() => setActiveTab("leaves")}
              className={`py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "leaves"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              🏖️ Leaves
            </button>

            {/* Tab 4: Reports */}
            <button
              onClick={() => setActiveTab("reports")}
              className={`py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "reports"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              📊 {isAdmin ? "Reports" : "My Reports"}
            </button>

            {/* Tab 5: Notifications */}
            <button
              onClick={() => setActiveTab("notifications")}
              className={`py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "notifications"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              🔔 Notifications
            </button>

            {/* Tab 6: Employees (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("employees")}
                className={`py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm ${activeTab === "employees"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                👥 Employees
              </button>
            )}
          </nav>
        </div>

        {activeTab === "attendance" ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3">
                {isAdmin ? "Add Attendance" : "Mark Your Attendance"}
              </h2>
              <AttendanceForm onRecordAdded={handleRecordAdded} userRole={user.role} userName={user.name} />
            </div>

            <NightDutyRequestSection userRole={user.role} userName={user.name} />

            {isAdmin && (
              <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3">
                  Monthly Attendance Records
                </h2>
                {loading ? (
                  <p className="text-gray-600 text-sm">Loading...</p>
                ) : (
                  <AttendanceTable records={records} />
                )}
              </div>
            )}
          </>
        ) : activeTab === "leaves" ? (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <LeaveManagement userRole={user.role} userName={user.name} adminName={user.role === "admin" ? user.name : undefined} />
          </div>
        ) : activeTab === "nightduty" ? (
          isAdmin ? (
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <NightDutyManagement adminName={user.name} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3">
                🌙 My Night Duty Requests
              </h2>
              <NightDutyRequestSection userRole={user.role} userName={user.name} />

              {/* Show user's own requests */}
              <div className="mt-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">My Requests History</h3>
                <UserNightDutyView userName={user.name} />
              </div>
            </div>
          )
        ) : activeTab === "reports" ? (
          isAdmin ? <AdminReportsView /> : <UserReportsView userName={user.name} />
        ) : activeTab === "notifications" ? (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            {isAdmin ? (
              <NotificationManagement />
            ) : (
              <UserNotifications userId={user.id} userName={user.name} />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <EmployeeManagement />
          </div>
        )}

        {/* Footer with Logout */}
        <footer className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="px-4 sm:px-6 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg"
            >
              Log out
            </button>
          </div>
          <p className="text-center text-[9px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
            © 2025-26 Bhikan Deshmukh. All rights reserved.
          </p>
        </footer>
      </div>
      <InstallPWA />
    </main>
  );
}
