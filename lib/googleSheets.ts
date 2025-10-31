/**
 * Google Sheets - Minimal Export Functions
 * Only used for CSV export functionality
 */

import { getMonthlyAttendance } from './firebase/attendance';
import { getAllLeaveRequests } from './firebase/leaves';

/**
 * Get attendance for a specific month (for export)
 */
export async function getSpecificMonthAttendance(
  spreadsheetId: string,
  year: string,
  month: string
) {
  return await getMonthlyAttendance(year, month);
}

/**
 * Get all leaves (for export)
 */
export async function getAllLeaves(spreadsheetId: string) {
  return await getAllLeaveRequests();
}
