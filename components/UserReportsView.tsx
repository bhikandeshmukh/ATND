"use client";

import { useState, useEffect } from "react";
import MonthlyReportSummary from "./MonthlyReportSummary";
import AttendanceTable from "./AttendanceTable";
import { AttendanceRecord } from "@/lib/types";

interface UserReportsViewProps {
  userName: string;
}

export default function UserReportsView({ userName }: UserReportsViewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear.toString()]; // Only current year

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchMonthlyRecords();
  }, [selectedYear, selectedMonth, userName]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchMonthlyRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/attendance/month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
      });

      if (response.ok) {
        const data = await response.json();
        const userRecords = Array.isArray(data) 
          ? data.filter((r: AttendanceRecord) => r.employeeName === userName)
          : [];
        setRecords(userRecords);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
            📊 Monthly Attendance Report
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading records...</p>
          </div>
        ) : records.length > 0 ? (
          <>
            <MonthlyReportSummary records={records} employees={employees} />
            <div className="mt-3 sm:mt-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">Detailed Records</h3>
              <AttendanceTable records={records} />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">No attendance records found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
          </div>
        )}
      </div>
    </div>
  );
}
