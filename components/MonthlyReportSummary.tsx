"use client";

import { AttendanceRecord } from "@/lib/types";

interface MonthlyReportSummaryProps {
  records: AttendanceRecord[];
  employees?: any[];
}

export default function MonthlyReportSummary({ records, employees = [] }: MonthlyReportSummaryProps) {
  // Calculate summary statistics
  const totalDaysCheckInOnly = records.filter(r => r.inTime && !r.outTime).length;

  // Calculate unique dates (actual working days)
  const uniqueDates = new Set(records.filter(r => r.inTime).map(r => r.date));
  const actualDaysWorked = uniqueDates.size;

  // Calculate present employees (unique employees who have attendance)
  const presentEmployees = new Set(records.filter(r => r.inTime).map(r => r.employeeName));
  const totalPresentEmployees = presentEmployees.size;
  const totalActiveEmployees = employees.length;

  const totalMinutes = records.reduce((sum, record) => {
    return sum + (record.totalMinutes || 0);
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const averageMinutesPerDay = actualDaysWorked > 0 ? Math.floor(totalMinutes / actualDaysWorked) : 0;
  const averageHoursPerDay = Math.floor(averageMinutesPerDay / 60);
  const averageMinutesRemainder = averageMinutesPerDay % 60;

  // Calculate total salary based on per minute rate
  const totalSalary = records.reduce((sum, record) => {
    const employee = employees.find(emp => emp.name === record.employeeName);
    const perMinuteRate = employee?.perMinuteRate || 0;
    return sum + ((record.totalMinutes || 0) * perMinuteRate);
  }, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 md:gap-2 mb-3">
      {/* Present Employees */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-teal-700 truncate">Present Employees</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-900 mt-0.5">{totalPresentEmployees}/{totalActiveEmployees}</p>
            <p className="text-[9px] sm:text-[10px] text-teal-600 truncate">
              {totalActiveEmployees > 0 ? Math.round((totalPresentEmployees / totalActiveEmployees) * 100) : 0}% attendance
            </p>
          </div>
          <div className="text-2xl sm:text-3xl ml-1">👥</div>
        </div>
      </div>

      {/* Total Days Present */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-green-700 truncate">Total Days Present</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 mt-0.5">{actualDaysWorked}</p>
            {totalDaysCheckInOnly > 0 && (
              <p className="text-[9px] sm:text-[10px] text-green-600 truncate">
                {totalDaysCheckInOnly} incomplete
              </p>
            )}
          </div>
          <div className="text-2xl sm:text-3xl ml-1">📅</div>
        </div>
      </div>

      {/* Total Hours Worked */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-blue-700 truncate">Total Hours Worked</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 mt-0.5">{totalHours}h</p>
            <p className="text-[9px] sm:text-[10px] text-blue-600 truncate">{remainingMinutes} minutes</p>
          </div>
          <div className="text-2xl sm:text-3xl ml-1">⏰</div>
        </div>
      </div>

      {/* Total Minutes */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-purple-700 truncate">Total Minutes</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900 mt-0.5">{totalMinutes}</p>
            <p className="text-[9px] sm:text-[10px] text-purple-600 truncate">minutes worked</p>
          </div>
          <div className="text-2xl sm:text-3xl ml-1">⏱️</div>
        </div>
      </div>

      {/* Average Per Day */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-orange-700 truncate">Average Per Day</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900 mt-0.5">{averageHoursPerDay}h</p>
            <p className="text-[9px] sm:text-[10px] text-orange-600 truncate">{averageMinutesRemainder} minutes</p>
          </div>
          <div className="text-2xl sm:text-3xl ml-1">📊</div>
        </div>
      </div>

      {/* Total Salary */}
      {totalSalary > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-yellow-700 truncate">Total Salary</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-900 mt-0.5">₹{totalSalary.toFixed(2)}</p>
              <p className="text-[9px] sm:text-[10px] text-yellow-600 truncate">based on per min rate</p>
            </div>
            <div className="text-2xl sm:text-3xl ml-1">💰</div>
          </div>
        </div>
      )}
    </div>
  );
}
