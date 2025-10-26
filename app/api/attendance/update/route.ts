import { NextRequest, NextResponse } from "next/server";
import { updateAttendanceCheckOut } from "@/lib/googleSheets";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, outTime, outLocation, modifiedBy } = body;

    if (!employeeName || !date || !outTime || !outLocation) {
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

    await updateAttendanceCheckOut(spreadsheetId, {
      employeeName,
      date,
      outTime,
      outLocation,
      modifiedBy: modifiedBy || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance record" },
      { status: 500 }
    );
  }
}
