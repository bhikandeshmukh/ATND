import { NextRequest, NextResponse } from "next/server";
import { addCheckIn, getAttendanceStatus } from "@/lib/firebase/attendance";
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
