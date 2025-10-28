import { NextRequest, NextResponse } from "next/server";
import { addCheckInRecord, checkTodayAttendanceStatus } from "@/lib/googleSheets";
import { logAttendanceChange } from "@/lib/audit/service";

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

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID not configured" },
        { status: 500 }
      );
    }

    // Check if this is an update (for audit logging)
    const existingStatus = await checkTodayAttendanceStatus(spreadsheetId, employeeName, date);
    const isUpdate = existingStatus.hasCheckedIn;

    await addCheckInRecord(spreadsheetId, {
      date,
      employeeName,
      inTime,
      inLocation,
      modifiedBy: modifiedBy || undefined,
    });

    // Create audit log if modified by admin
    if (modifiedBy && employeeId) {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding check-in:", error);
    return NextResponse.json(
      { error: "Failed to add check-in record" },
      { status: 500 }
    );
  }
}
