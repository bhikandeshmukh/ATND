"use client";

import { AttendanceRecord } from "@/lib/types";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  employees?: any[];
}

export default function AttendanceTable({ records, employees = [] }: AttendanceTableProps) {
  if (!Array.isArray(records) || records.length === 0) {
    return <p className="text-gray-600">No attendance records for this month.</p>;
  }

  // Calculate daily earning for each record
  const calculateDailyEarning = (record: AttendanceRecord) => {
    const employee = employees.find(emp => emp.name === record.employeeName);
    
    if (!employee) {
      console.log(`Employee not found for: ${record.employeeName}`);
      return 0;
    }
    
    if (!record.totalMinutes) {
      console.log(`No totalMinutes for: ${record.employeeName}`);
      return 0;
    }

    console.log(`Employee ${employee.name}: perMinuteRate=${employee.perMinuteRate}, fixedSalary=${employee.fixedSalary}, totalWorkingDays=${employee.totalWorkingDays}`);

    if (employee.perMinuteRate && employee.perMinuteRate > 0) {
      const earning = Math.round(record.totalMinutes * employee.perMinuteRate);
      console.log(`Calculated earning (per minute): ₹${earning}`);
      return earning;
    } else if (employee.fixedSalary && employee.fixedSalary > 0 && employee.totalWorkingDays) {
      const earning = Math.round(employee.fixedSalary / employee.totalWorkingDays);
      console.log(`Calculated earning (fixed salary): ₹${earning}`);
      return earning;
    }
    
    console.log(`No earning calculation possible for: ${employee.name}`);
    return 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              In Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Out Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              In Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Out Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Minutes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Daily Earning
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record, index) => {
            const dailyEarning = calculateDailyEarning(record);
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.employeeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.inTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.outTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.inLocation || "Not captured"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.outLocation || "Not captured"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.totalMinutes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.totalHours}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                  {dailyEarning > 0 ? `₹${dailyEarning}` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
