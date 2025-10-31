"use client";

import { useState, useEffect } from "react";

interface NightDutyRequest {
  id: string;
  employeeName: string;
  date: string;
  reason: string;
  requestedBy?: string;
  status: "pending" | "approved" | "rejected";
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  approvedTime?: string;
}

interface NightDutyManagementProps {
  adminName: string;
}

export default function NightDutyManagement({ adminName }: NightDutyManagementProps) {
  const [requests, setRequests] = useState<NightDutyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/night-duty");
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching night duty requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    if (processingId) return; // Prevent duplicate clicks
    
    setProcessingId(id);
    try {
      const response = await fetch("/api/night-duty/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          status,
          approvedBy: `Admin: ${adminName}`
        }),
      });

      if (response.ok) {
        alert(`✅ Night duty request ${status} successfully!`);
        fetchRequests();
      } else {
        alert("❌ Failed to update request status");
      }
    } catch (error) {
      alert("❌ Error updating request status");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
          🌙 Night Duty Requests
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                    Shift Time
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                    Requested By
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
                  <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {request.employeeName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {request.date}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-indigo-600 font-medium">
                      9:00 PM - 7:00 AM
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                      {request.reason}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {request.requestedBy || request.employeeName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {request.approvedBy || "-"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {request.approvedDate || "-"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {request.approvedTime || "-"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(request.id, "approved")}
                            disabled={processingId === request.id}
                            className="text-green-600 hover:text-green-800 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === request.id ? "⏳" : "✓"} Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, "rejected")}
                            disabled={processingId === request.id}
                            className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === request.id ? "⏳" : "✗"} Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl sm:text-6xl mb-4">🌙</div>
            <p className="text-gray-600 text-sm sm:text-base">No night duty requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}
