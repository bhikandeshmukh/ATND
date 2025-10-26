"use client";

import { useState, useEffect } from "react";

interface NightDutyRequestSectionProps {
    userRole: "admin" | "user";
    userName?: string;
}

export default function NightDutyRequestSection({ userRole, userName }: NightDutyRequestSectionProps) {
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [canRequest, setCanRequest] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (userRole === "admin") {
            fetchEmployees();
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole === "user" && userName) {
            setSelectedEmployee(userName);
            checkIfCanRequest(userName);
        }
    }, [userName, userRole]);

    useEffect(() => {
        if (userRole === "admin" && selectedEmployee) {
            checkIfCanRequest(selectedEmployee);
        }
    }, [selectedEmployee, userRole]);

    const fetchEmployees = async () => {
        try {
            const response = await fetch("/api/employees");
            const data = await response.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const checkIfCanRequest = async (empName: string) => {
        if (!empName) return;

        try {
            const today = new Date().toISOString().split("T")[0];
            const response = await fetch("/api/attendance/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeName: empName, date: today }),
            });

            if (response.ok) {
                const status = await response.json();
                // Can request only if both check-in and check-out are done
                setCanRequest(status.hasCheckedIn && status.hasCheckedOut);
            }
        } catch (error) {
            console.error("Error checking attendance status:", error);
        }
    };

    const handleNightDutyRequest = async () => {
        const empName = userRole === "admin" ? selectedEmployee : userName;

        if (!empName) {
            alert("❌ Please select an employee first!");
            return;
        }

        const confirmed = confirm(
            "🌙 Night Duty Request\n\n" +
            `Employee: ${empName}\n` +
            "This will request night duty hours (9:00 PM - 7:00 AM) for today.\n" +
            (userRole === "user" ? "Admin approval is required.\n\n" : "\n") +
            "Do you want to proceed?"
        );

        if (!confirmed) return;

        setSubmitting(true);
        setMessage("");

        try {
            const today = new Date().toISOString().split("T")[0];
            const response = await fetch("/api/night-duty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeName: empName,
                    date: today,
                    reason: "Night duty request",
                }),
            });

            if (response.ok) {
                alert("✅ Night duty request submitted successfully!\n\nWaiting for admin approval.");
                setMessage("✅ Night duty request submitted!");
                setCanRequest(false);
            } else {
                const errorData = await response.json();
                alert(`❌ Error: ${errorData.error || "Failed to submit night duty request"}`);
                setMessage("❌ Failed to submit request");
            }
        } catch (error) {
            alert("❌ Network Error!\n\nFailed to submit request. Please try again.");
            setMessage("❌ Network error");
        } finally {
            setSubmitting(false);
        }
    };

    // For users, only show if they can request
    // For admin, always show
    if (userRole === "user" && !canRequest) return null;

    return (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-lg p-3 sm:p-4">
                {userRole === "admin" && (
                    <div className="mb-3">
                        <label className="block text-xs sm:text-sm font-medium text-indigo-900 mb-1">
                            Select Employee for Night Duty
                        </label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">Select Employee</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.name}>
                                    {emp.name}
                                </option>
                            ))}
                        </select>
                        {selectedEmployee && !canRequest && (
                            <p className="text-xs text-red-600 mt-1">
                                ⚠️ This employee hasn't completed attendance today
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl sm:text-3xl">🌙</span>
                        <div>
                            <h3 className="text-sm sm:text-base font-semibold text-indigo-900">Night Duty Request</h3>
                            <p className="text-xs sm:text-sm text-indigo-700 mt-0.5">
                                Request night shift hours (9:00 PM - 7:00 AM)
                            </p>
                            <p className="text-[10px] sm:text-xs text-indigo-600 mt-1">
                                ⏰ 10 hours shift {userRole === "user" && "• Requires admin approval"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleNightDutyRequest}
                        disabled={submitting || !canRequest}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        {submitting ? "Submitting..." : "Request Night Duty"}
                    </button>
                </div>
                {message && (
                    <div className={`mt-3 p-2 rounded text-xs sm:text-sm text-center font-medium ${message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}
