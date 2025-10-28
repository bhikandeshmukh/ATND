"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/lib/types";
import SearchBar from "./SearchBar";
import { TableSkeleton } from "./LoadingSkeleton";
import { showToast } from "./Toast";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    role: "user",
    status: "active",
    totalWorkingDays: "",
    fixedInTime: "",
    fixedOutTime: "",
    perMinuteRate: "",
    fixedSalary: "",
    username: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employees");
      const data = await response.json();
      const empList = Array.isArray(data) ? data : [];
      setEmployees(empList);
      setFilteredEmployees(empList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter((emp) =>
      emp.name.toLowerCase().includes(query.toLowerCase()) ||
      emp.position.toLowerCase().includes(query.toLowerCase()) ||
      emp.id.toLowerCase().includes(query.toLowerCase()) ||
      emp.username?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleExport = () => {
    window.open("/api/export/employees", "_blank");
    showToast("Exporting employees data...", "info");
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast("Employee added successfully!", "success");
        setFormData({
          name: "",
          position: "",
          role: "user",
          status: "active",
          totalWorkingDays: "",
          fixedInTime: "",
          fixedOutTime: "",
          perMinuteRate: "",
          fixedSalary: "",
          username: "",
          password: "",
        });
        setShowForm(false);
        fetchEmployees();
      } else {
        showToast("Error adding employee", "error");
      }
    } catch (error) {
      showToast("Error adding employee", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      const response = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("Employee deleted successfully", "success");
        fetchEmployees();
      } else {
        showToast("Failed to delete employee", "error");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      showToast("Error deleting employee", "error");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Profiles</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add Employee"}
          </button>
        </div>
      </div>

      {!showForm && (
        <SearchBar
          placeholder="Search employees by name, position, ID..."
          onSearch={handleSearch}
        />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Manager, Developer, HR"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Working Days *
              </label>
              <input
                type="number"
                required
                value={formData.totalWorkingDays}
                onChange={(e) => setFormData({ ...formData, totalWorkingDays: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed In Time *
              </label>
              <input
                type="time"
                required
                value={formData.fixedInTime}
                onChange={(e) => setFormData({ ...formData, fixedInTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Out Time *
              </label>
              <input
                type="time"
                required
                value={formData.fixedOutTime}
                onChange={(e) => setFormData({ ...formData, fixedOutTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per Minute Rate (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.perMinuteRate}
                onChange={(e) => setFormData({ ...formData, perMinuteRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Salary (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.fixedSalary}
                onChange={(e) => setFormData({ ...formData, fixedSalary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username (for login)
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g., john.doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (for login)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Set employee password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {submitting ? "Adding..." : "Add Employee"}
          </button>

          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </form>
      )}

      {loading ? (
        <TableSkeleton rows={5} columns={12} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Min Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fixed Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{employee.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    employee.role === "admin" 
                      ? "bg-purple-100 text-purple-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {employee.role === "admin" ? "Admin" : "User"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    employee.status === "active" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {employee.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.totalWorkingDays}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.fixedInTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.fixedOutTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{employee.perMinuteRate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{employee.fixedSalary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.username || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && employees.length > 0 && (
            <p className="text-center py-8 text-gray-600">No employees found matching "{searchQuery}"</p>
          )}
          {employees.length === 0 && (
            <p className="text-center py-8 text-gray-600">No employees added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
