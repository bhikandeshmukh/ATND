"use client";

import { useState, useEffect } from "react";
import { getCurrentLocation, isWithinOfficeRadius, getOfficeLocation } from "@/lib/geofence";

interface AttendanceFormProps {
  onRecordAdded: () => void;
  userRole: "admin" | "user";
  userName?: string;
}

export default function AttendanceForm({ onRecordAdded, userRole, userName }: AttendanceFormProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  // Get Indian Standard Time (IST) date
  const getISTDate = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState(() => {
    const today = getISTDate();
    return {
      employeeName: "",
      date: today,
      inTime: "",
      outTime: "",
      inLocation: "",
      outLocation: "",
    };
  });

  useEffect(() => {
    // Get IST date
    const today = getISTDate();
    const savedDate = localStorage.getItem("lastAttendanceDate");

    // Auto-reset if date has changed
    if (savedDate && savedDate !== today) {
      console.log("🔄 Auto-reset triggered: Date changed from", savedDate, "to", today);

      // Clear ALL old attendance keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("attendance_")) {
          console.log("Removing old key:", key);
          localStorage.removeItem(key);
        }
      });

      // Reset ALL states for new day
      setInTimeDone(false);
      setOutTimeDone(false);
      setMessage("");
      setFormData(prev => ({
        ...prev,
        date: today,
        inTime: "",
        outTime: "",
        inLocation: "",
        outLocation: "",
      }));
      setLocationStatus({ inLocation: null, outLocation: null });
      setHasEdited(false);

      console.log("✅ Auto-reset complete - Ready for new day:", today);
    }

    // Save current date
    localStorage.setItem("lastAttendanceDate", today);

    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees");
        const data = await response.json();
        const employeeList = Array.isArray(data) ? data : [];
        setEmployees(employeeList);

        if (userRole === "user" && userName && employeeList.length > 0) {
          const userEmployee = employeeList.find((emp: any) => emp.name === userName);
          if (userEmployee) {
            setFormData(prev => ({
              ...prev,
              employeeName: userEmployee.name,
              date: today, // Always set to today
            }));

            // Check if user has already checked in today
            checkAttendanceStatus(userEmployee.name);
          }
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();

    // Check location permission for users
    if (userRole === "user") {
      checkLocationPermission();
    }
  }, [userRole, userName]);

  // Auto-reset check - runs every 30 seconds
  useEffect(() => {
    const autoResetCheck = () => {
      const today = getISTDate();
      const savedDate = localStorage.getItem("lastAttendanceDate");

      // If date has changed, reset the form
      if (savedDate && savedDate !== today) {
        console.log("Date changed from", savedDate, "to", today, "- Resetting form");

        // Clear ALL old attendance completion keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith("attendance_") && !key.includes(today)) {
            console.log("Removing old key:", key);
            localStorage.removeItem(key);
          }
        });

        setInTimeDone(false);
        setOutTimeDone(false);
        setMessage("");
        setFormData(prev => ({
          ...prev,
          date: today,
          inTime: "",
          outTime: "",
          inLocation: "",
          outLocation: "",
        }));
        setLocationStatus({ inLocation: null, outLocation: null });
        setHasEdited(false);

        // Re-check attendance status for new day
        if (formData.employeeName) {
          setTimeout(() => {
            checkAttendanceStatus(formData.employeeName);
          }, 100);
        }
      }

      // Save current date
      localStorage.setItem("lastAttendanceDate", today);
    };

    // Check immediately on mount
    autoResetCheck();

    // Check every 30 seconds for date change (auto-reset at midnight)
    const interval = setInterval(autoResetCheck, 30000);

    return () => clearInterval(interval);
  }, [formData.employeeName]);

  const checkLocationPermission = async () => {
    if (!("geolocation" in navigator)) {
      alert("⚠️ Location Not Supported\n\nYour browser doesn't support location services. Please use a modern browser.");
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

      if (permission.state === 'denied') {
        alert("🚫 Location Permission Required\n\nPlease enable location access in your browser settings to mark attendance.\n\nSteps:\n1. Click the lock icon in address bar\n2. Allow location access\n3. Refresh the page");
      }
    } catch (error) {
      // Fallback - will check when user clicks button
      console.log("Permissions API not supported");
    }
  };

  const checkAttendanceStatus = async (employeeName: string) => {
    try {
      const today = getISTDate();

      // First check localStorage for completion status
      const completionKey = `attendance_${today}_${employeeName}`;
      const isCompleted = localStorage.getItem(completionKey);

      if (isCompleted === "completed") {
        setMessage("✅ You have already completed attendance for today!");
        setInTimeDone(true);
        setOutTimeDone(true);
        return;
      }

      const response = await fetch("/api/attendance/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeName, date: today }),
      });

      if (response.ok) {
        const status = await response.json();

        if (status.hasCheckedIn) {
          setFormData(prev => ({
            ...prev,
            date: today,
            inTime: status.inTime,
            inLocation: status.inLocation,
            outTime: status.outTime || "",
            outLocation: status.outLocation || "",
          }));
          setInTimeDone(true);

          if (status.hasCheckedOut) {
            setOutTimeDone(true);
            setMessage("✅ You have already completed attendance for today!");
            // Save completion status
            localStorage.setItem(completionKey, "completed");
          } else {
            setMessage("✅ Check In found! You can now mark Check Out.");
          }
        } else {
          // No attendance for today - ensure form is clean
          setFormData(prev => ({
            ...prev,
            date: today,
            inTime: "",
            outTime: "",
            inLocation: "",
            outLocation: "",
          }));
          setInTimeDone(false);
          setOutTimeDone(false);
          setMessage("");
        }
      }
    } catch (error) {
      console.error("Error checking attendance status:", error);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [inTimeDone, setInTimeDone] = useState(false);
  const [outTimeDone, setOutTimeDone] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{
    inLocation: { allowed: boolean; distance: number } | null;
    outLocation: { allowed: boolean; distance: number } | null;
  }>({ inLocation: null, outLocation: null });
  const [hasEdited, setHasEdited] = useState(false);

  const handleInTimeDone = async () => {
    // Check if attendance is already completed for today
    const today = getISTDate();
    const completionKey = `attendance_${today}_${formData.employeeName}`;
    const isCompleted = localStorage.getItem(completionKey);

    if (isCompleted === "completed") {
      setMessage("✅ You have already completed attendance for today!");
      return;
    }

    if (inTimeDone) {
      setMessage("⚠️ You have already marked Check In today!");
      return;
    }

    setGettingLocation(true);
    setMessage("");

    try {
      const location = await getCurrentLocation();
      const { latitude, longitude, locationString } = location;

      if (userRole === "user") {
        const check = isWithinOfficeRadius(latitude, longitude);
        setLocationStatus(prev => ({ ...prev, inLocation: check }));

        if (!check.allowed) {
          setMessage(`❌ You are ${check.distance}m away from office. You must be within ${getOfficeLocation().radius}m to mark attendance.`);
          setGettingLocation(false);
          return;
        }
      }

      // Get IST time
      const istTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const currentTime = istTime;
      const currentDate = getISTDate();

      const checkInData = {
        employeeName: formData.employeeName,
        date: currentDate,
        inTime: currentTime,
        inLocation: locationString,
        modifiedBy: userRole === "admin" ? userName : undefined,
      };

      // Submit check-in to sheet
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkInData),
      });

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          date: currentDate,
          inTime: currentTime,
          inLocation: locationString,
        }));

        setInTimeDone(true);
        alert(`✅ Check In Successful!\n\nTime: ${currentTime}\nDate: ${currentDate}`);
        setMessage(`✅ Check In recorded at ${currentTime}`);
        onRecordAdded();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error || "Failed to record check-in"}`);
        setMessage("❌ Failed to record check-in");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("❌ Location Permission Required!\n\nPlease enable location access in your browser.");
      setMessage("❌ Location permission required!");
    } finally {
      setGettingLocation(false);
    }
  };

  const handleOutTimeDone = async () => {
    // Check if attendance is already completed for today
    const today = getISTDate();
    const completionKey = `attendance_${today}_${formData.employeeName}`;
    const isCompleted = localStorage.getItem(completionKey);

    if (isCompleted === "completed") {
      setMessage("✅ You have already completed attendance for today!");
      return;
    }

    if (outTimeDone) {
      setMessage("⚠️ You have already marked Check Out today!");
      return;
    }

    setGettingLocation(true);
    setMessage("");

    try {
      const location = await getCurrentLocation();
      const { latitude, longitude, locationString } = location;

      if (userRole === "user") {
        const check = isWithinOfficeRadius(latitude, longitude);
        setLocationStatus(prev => ({ ...prev, outLocation: check }));

        if (!check.allowed) {
          setMessage(`❌ You are ${check.distance}m away from office. You must be within ${getOfficeLocation().radius}m to mark attendance.`);
          setGettingLocation(false);
          return;
        }
      }

      // Get IST time
      const istTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const currentTime = istTime;

      const updatedData = {
        ...formData,
        outTime: currentTime,
        outLocation: locationString,
      };

      setFormData(updatedData);
      setOutTimeDone(true);

      // Auto-submit check-out (update existing record)
      await submitCheckOut(updatedData);
    } catch (error) {
      console.error("Error getting location:", error);
      alert("❌ Location Permission Required!\n\nPlease enable location access in your browser.");
      setMessage("❌ Location permission required!");
    } finally {
      setGettingLocation(false);
    }
  };

  const submitCheckOut = async (data: typeof formData) => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/attendance/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: data.employeeName,
          date: data.date,
          outTime: data.outTime,
          outLocation: data.outLocation,
          modifiedBy: userRole === "admin" ? userName : undefined,
        }),
      });

      if (response.ok) {
        alert(`✅ Check Out Successful!\n\nCheck In: ${data.inTime}\nCheck Out: ${data.outTime}\nDate: ${data.date}`);
        setMessage("✅ Attendance completed for today! See you tomorrow.");

        // Save completion status for today
        const today = getISTDate();
        localStorage.setItem("lastAttendanceDate", today);
        localStorage.setItem(`attendance_${today}_${data.employeeName}`, "completed");

        onRecordAdded();

        // Don't reset - keep showing completed status until next day
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error || "Failed to record check-out"}`);
        setMessage(`❌ ${errorData.error || "Error recording check-out"}`);
      }
    } catch (error) {
      alert("❌ Network Error!\n\nFailed to record check-out. Please try again.");
      setMessage("❌ Error recording check-out");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Employee Name
          </label>
          <select
            required
            value={formData.employeeName}
            onChange={(e) => {
              const selectedName = e.target.value;
              setFormData({ ...formData, employeeName: selectedName });

              // Check attendance status for selected employee (for admin)
              if (userRole === "admin" && selectedName) {
                checkAttendanceStatus(selectedName);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={userRole === "user"}
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.name}>
                {employee.name}
              </option>
            ))}
          </select>
          {userRole === "user" && employees.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Your profile is auto-selected</p>
          )}
          {userRole === "admin" && (
            <p className="text-xs text-blue-600 mt-1">Select employee to view/edit their attendance</p>
          )}
        </div>

        {/* Check In Section */}
        <div className="md:col-span-2">
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-2 sm:p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-green-900">🟢 In</h3>
              </div>
              <button
                type="button"
                onClick={handleInTimeDone}
                disabled={gettingLocation || inTimeDone}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all ${inTimeDone
                  ? "bg-green-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
                  } disabled:bg-gray-400`}
              >
                {gettingLocation ? "⏳ Processing..." : inTimeDone ? "✅ Done" : "Check In"}
              </button>
            </div>
            {inTimeDone && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-2">
                  <span className="text-gray-600">Time:</span>
                  {userRole === "admin" ? (
                    <input
                      type="text"
                      value={formData.inTime}
                      onChange={(e) => {
                        setFormData({ ...formData, inTime: e.target.value });
                        setHasEdited(true);
                      }}
                      className="ml-2 font-semibold text-green-800 border-b border-green-300 focus:outline-none focus:border-green-600 w-32"
                      placeholder="HH:MM:SS AM/PM"
                    />
                  ) : (
                    <span className="ml-2 font-semibold text-green-800">{formData.inTime}</span>
                  )}
                </div>
                <div className="bg-white rounded p-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-semibold text-green-800">{formData.date}</span>
                </div>
                <div className="col-span-2 bg-white rounded p-2">
                  <span className="text-gray-600">Location:</span>
                  {userRole === "admin" ? (
                    <input
                      type="text"
                      value={formData.inLocation}
                      onChange={(e) => {
                        setFormData({ ...formData, inLocation: e.target.value });
                        setHasEdited(true);
                      }}
                      className="ml-2 font-mono text-xs text-green-800 border-b border-green-300 focus:outline-none focus:border-green-600 w-full"
                      placeholder="Latitude, Longitude"
                    />
                  ) : (
                    <span className="ml-2 font-mono text-xs text-green-800">{formData.inLocation}</span>
                  )}
                </div>
                {locationStatus.inLocation && (
                  <div className="col-span-2 text-xs text-green-700">
                    ✅ Verified: {locationStatus.inLocation.distance}m from office
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Check Out Section */}
        <div className="md:col-span-2">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-2 sm:p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-red-900">🔴 Out</h3>
              </div>
              <button
                type="button"
                onClick={handleOutTimeDone}
                disabled={gettingLocation || outTimeDone}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all ${outTimeDone
                  ? "bg-red-600 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 hover:shadow-lg"
                  } disabled:bg-gray-400`}
              >
                {gettingLocation ? "⏳ Processing..." : outTimeDone ? "✅ Done" : "Check Out"}
              </button>
            </div>
            {outTimeDone && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-2">
                  <span className="text-gray-600">Time:</span>
                  {userRole === "admin" ? (
                    <input
                      type="text"
                      value={formData.outTime}
                      onChange={(e) => {
                        setFormData({ ...formData, outTime: e.target.value });
                        setHasEdited(true);
                      }}
                      className="ml-2 font-semibold text-red-800 border-b border-red-300 focus:outline-none focus:border-red-600 w-32"
                      placeholder="HH:MM:SS AM/PM"
                    />
                  ) : (
                    <span className="ml-2 font-semibold text-red-800">{formData.outTime}</span>
                  )}
                </div>
                <div className="bg-white rounded p-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-semibold text-red-800">{formData.date}</span>
                </div>
                <div className="col-span-2 bg-white rounded p-2">
                  <span className="text-gray-600">Location:</span>
                  {userRole === "admin" ? (
                    <input
                      type="text"
                      value={formData.outLocation}
                      onChange={(e) => {
                        setFormData({ ...formData, outLocation: e.target.value });
                        setHasEdited(true);
                      }}
                      className="ml-2 font-mono text-xs text-red-800 border-b border-red-300 focus:outline-none focus:border-red-600 w-full"
                      placeholder="Latitude, Longitude"
                    />
                  ) : (
                    <span className="ml-2 font-mono text-xs text-red-800">{formData.outLocation}</span>
                  )}
                </div>
                {locationStatus.outLocation && (
                  <div className="col-span-2 text-xs text-red-700">
                    ✅ Verified: {locationStatus.outLocation.distance}m from office
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {userRole === "admin" && hasEdited && (inTimeDone || outTimeDone) && (
        <button
          onClick={async () => {
            setSubmitting(true);
            try {
              // Update check-in if edited (Admin modification)
              if (inTimeDone) {
                const response = await fetch("/api/attendance/checkin", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    employeeName: formData.employeeName,
                    date: formData.date,
                    inTime: formData.inTime,
                    inLocation: formData.inLocation,
                    modifiedBy: `Admin: ${userName}`,
                  }),
                });
                if (!response.ok) throw new Error("Failed to update check-in");
              }

              // Update check-out if edited (Admin modification)
              if (outTimeDone) {
                const response = await fetch("/api/attendance/update", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    employeeName: formData.employeeName,
                    date: formData.date,
                    outTime: formData.outTime,
                    outLocation: formData.outLocation,
                    modifiedBy: `Admin: ${userName}`,
                  }),
                });
                if (!response.ok) throw new Error("Failed to update check-out");
              }

              alert("✅ Changes Saved Successfully!");
              setHasEdited(false);
              onRecordAdded();
            } catch (error) {
              alert("❌ Failed to save changes. Please try again.");
            } finally {
              setSubmitting(false);
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-2 sm:py-2.5 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          💾 Save Changes
        </button>
      )}

      {message && (
        <div className={`p-2 sm:p-3 rounded-lg text-center text-xs sm:text-sm font-semibold ${message.includes("success") || message.includes("✅")
          ? "bg-green-100 text-green-800 border-2 border-green-300"
          : "bg-red-100 text-red-800 border-2 border-red-300"
          }`}>
          {message}
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-800">Submitting Attendance...</p>
          </div>
        </div>
      )}
    </div>
  );
}
