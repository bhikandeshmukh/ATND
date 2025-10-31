import { NextRequest, NextResponse } from "next/server";
import { addCheckIn, getAttendanceStatus } from "@/lib/firebase/attendance";
import { logAttendanceChange } from "@/lib/audit/service";
import { getAllEmployees } from "@/lib/firebase/employees";
import { createNotification, NotificationType } from "@/lib/notifications/service";

/**
 * Check if employee arrived late and send notifications
 */
async function checkLateArrival(employeeName: string, inTime: string, employeeId?: string) {
  try {
    const employees = await getAllEmployees();
    const employee = employees.find(emp => emp.name === employeeName);
    
    if (!employee || !employee.fixedInTime) return;

    // Parse times
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const actualInMinutes = parseTime(inTime);
    const expectedInMinutes = parseTime(employee.fixedInTime);
    const lateMinutes = actualInMinutes - expectedInMinutes;

    // If late by more than 5 minutes
    if (lateMinutes > 5) {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) return;

      // Send notification to employee
      if (employee.id) {
        await createNotification(spreadsheetId, {
          userId: employee.id,
          type: NotificationType.LATE_ARRIVAL,
          title: '⏰ Late Arrival Alert',
          message: `You arrived ${lateMinutes} minutes late today. Expected: ${employee.fixedInTime}, Actual: ${inTime}`,
          data: {
            expectedTime: employee.fixedInTime,
            actualTime: inTime,
            lateMinutes,
          },
        });
      }

      // Send notification to all admins
      const admins = employees.filter(emp => emp.role === 'admin');
      for (const admin of admins) {
        if (admin.id) {
          await createNotification(spreadsheetId, {
            userId: admin.id,
            type: NotificationType.LATE_ARRIVAL,
            title: '⏰ Employee Late Arrival',
            message: `${employeeName} arrived ${lateMinutes} minutes late. Expected: ${employee.fixedInTime}, Actual: ${inTime}`,
            data: {
              employeeName,
              expectedTime: employee.fixedInTime,
              actualTime: inTime,
              lateMinutes,
            },
          });
        }
      }

      console.log(`⏰ Late arrival alert sent for ${employeeName} (${lateMinutes} min late)`);
    }
  } catch (error) {
    console.error('Error checking late arrival:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, inTime, inLocation, modifiedBy, employeeId } = body;

    if (!employeeName || !date || !inTime || !inLocation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if this is an update (for audit logging)
    const existingStatus = await getAttendanceStatus(employeeName, date);
    const isUpdate = existingStatus.hasCheckedIn;

    await addCheckIn({
      date,
      employeeName,
      inTime,
      inLocation,
      modifiedBy: modifiedBy || undefined,
    });

    // Check for late arrival
    await checkLateArrival(employeeName, inTime, employeeId);

    // Create audit log if modified by admin
    if (modifiedBy && employeeId) {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (spreadsheetId) {
        await logAttendanceChange(spreadsheetId, {
          employeeId: employeeId,
          employeeName: employeeName,
          date: date,
          fieldChanged: "Check In",
          oldValue: isUpdate ? existingStatus.inTime : "Not checked in",
          newValue: `${inTime} at ${inLocation}`,
          performedBy: modifiedBy,
          performedById: modifiedBy.includes("Admin") ? "ADMIN" : employeeId,
          reason: "Admin modification",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding check-in:", error);
    return NextResponse.json(
      { error: "Failed to add check-in record" },
      { status: 500 }
    );
  }
}
