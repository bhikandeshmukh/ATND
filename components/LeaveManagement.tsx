"use client";

import { useState, useEffect } from "react";

interface LeaveManagementProps {
    userRole: "admin" | "user";
    userName?: string;
    adminName?: string;
}

interface LeaveRecord {
    id: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    appliedDate: string;
    paymentStatus?: string;
    approvedBy?: string;
    approvedDate?: string;
    approvedTime?: string;
}

export default function LeaveManagement({ userRole, userName, adminName }: LeaveManagementProps) {
    const [employees, setEmployees] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        employeeName: userName || "",
        leaveType: "sick",
        startDate: "",
        endDate: "",
        reason: "",
    });

    useEffect(() => {
        fetchEmployees();
        fetchLeaves();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch("/api/employees");
            const data = await response.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/leaves");
            const data = await response.json();
            const allLeaves = Array.isArray(data) ? data : [];

            // Filter for users to show only their leaves
            if (userRole === "user" && userName) {
                setLeaves(allLeaves.filter((leave: LeaveRecord) => leave.employeeName === userName));
            } else {
                setLeaves(allLeaves);
            }
        } catch (error) {
            console.error("Error fetching leaves:", error);
            setLeaves([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/leaves", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert("✅ Leave application submitted successfully!");
                setFormData({
                    employeeName: userName || "",
                    leaveType: "sick",
                    startDate: "",
                    endDate: "",
                    reason: "",
                });
                setShowForm(false);
                fetchLeaves();
            } else {
                alert("❌ Failed to submit leave application");
            }
        } catch (error) {
            alert("❌ Error submitting leave application");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: "approved" | "rejected", paymentStatus?: string) => {
        if (processingId) return; // Prevent duplicate clicks
        
        setProcessingId(id);
        try {
            const response = await fetch("/api/leaves/status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id, 
                    status, 
                    paymentStatus,
                    approvedBy: adminName ? `Admin: ${adminName}` : undefined
                }),
            });

            if (response.ok) {
                alert(`✅ Leave ${status} successfully!`);
                fetchLeaves();
            } else {
                alert("❌ Failed to update leave status");
            }
        } catch (error) {
            alert("❌ Error updating leave status");
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveWithPayment = (id: string, leaveType: string) => {
        if (processingId) return; // Prevent duplicate clicks
        
        // Sick and Casual leaves are unpaid by default
        const defaultPaymentStatus = (leaveType === "sick" || leaveType === "casual") ? "unpaid" : "paid";

        const paymentStatus = prompt(
            `Select payment status for this leave:\n\nType "paid" or "unpaid"\n\nDefault for ${leaveType} leave: ${defaultPaymentStatus}`,
            defaultPaymentStatus
        );

        if (paymentStatus && (paymentStatus === "paid" || paymentStatus === "unpaid")) {
            handleStatusUpdate(id, "approved", paymentStatus);
        } else if (paymentStatus !== null) {
            alert("❌ Invalid input! Please enter 'paid' or 'unpaid'");
        }
    };

    const getStatusColor = (status: string) => {
        const lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-yellow-100 text-yellow-800";
        }
    };

    const calculateDays = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
                    🏖️ Leave Management
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    {showForm ? "Cancel" : "+ Apply Leave"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userRole === "admin" && (
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Employee Name *
                                </label>
                                <select
                                    required
                                    value={formData.employeeName}
                                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.name}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Leave Type *
                            </label>
                            <select
                                required
                                value={formData.leaveType}
                                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="sick">Sick Leave</option>
                                <option value="casual">Casual Leave</option>
                                <option value="earned">Earned Leave</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                End Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Reason *
                            </label>
                            <textarea
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Please provide reason for leave..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 sm:px-6 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? "Submitting..." : "Submit Leave Application"}
                    </button>
                </form>
            )}

            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">
                    {userRole === "admin" ? "All Leave Applications" : "My Leave Applications"}
                </h3>

                {loading ? (
                    <div className="animate-pulse">
                        {/* Table Header Skeleton */}
                        <div className="bg-gray-100 rounded-t-lg p-3 mb-2">
                            <div className="grid grid-cols-8 gap-2">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-3 bg-gray-300 rounded"></div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Table Rows Skeleton */}
                        {[...Array(5)].map((_, rowIndex) => (
                            <div key={rowIndex} className="bg-white border-b p-3">
                                <div className="grid grid-cols-8 gap-2">
                                    {[...Array(8)].map((_, colIndex) => (
                                        <div key={colIndex} className="h-3 bg-gray-200 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        <div className="text-center py-4">
                            <p className="text-gray-500 text-sm animate-pulse">Loading leave requests...</p>
                        </div>
                    </div>
                ) : leaves.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Employee
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Type
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Start Date
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        End Date
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Days
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Reason
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Approved By
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Approved Date
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                        Approved Time
                                    </th>
                                    {userRole === "admin" && (
                                        <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                                            Action
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                            {leave.employeeName}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 capitalize">
                                            {leave.leaveType}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                            {leave.startDate}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                            {leave.endDate}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                            {calculateDays(leave.startDate, leave.endDate)}
                                        </td>
                                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                                            {leave.reason}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusColor(
                                                    leave.status
                                                )}`}
                                            >
                                                {leave.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                            {leave.approvedBy || "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                            {leave.approvedDate || "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                            {leave.approvedTime || "-"}
                                        </td>
                                        {userRole === "admin" && (
                                            <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                                                {leave.status === "pending" && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApproveWithPayment(leave.id, leave.leaveType)}
                                                            disabled={processingId === leave.id}
                                                            className="text-green-600 hover:text-green-800 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {processingId === leave.id ? "⏳" : "✓"} Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(leave.id, "rejected")}
                                                            disabled={processingId === leave.id}
                                                            className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {processingId === leave.id ? "⏳" : "✗"} Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-4xl sm:text-6xl mb-4">📭</div>
                        <p className="text-gray-600 text-sm sm:text-base">No leave applications found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
