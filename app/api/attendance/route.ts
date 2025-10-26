import { NextRequest, NextResponse } from "next/server";
import { addAttendanceRecord, getMonthlyAttendance } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, inTime, outTime, inLocation, outLocation } = body;

    if (!employeeName || !date || !inTime || !outTime) {
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

    await addAttendanceRecord(spreadsheetId, {
      date,
      employeeName,
      inTime,
      outTime,
      inLocation: inLocation || "Not captured",
      outLocation: outLocation || "Not captured",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding attendance:", error);
    return NextResponse.json(
      { error: "Failed to add attendance record" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID not configured" },
        { status: 500 }
      );
    }

    const rows = await getMonthlyAttendance(spreadsheetId);
    
    const records = rows.map((row: any[]) => ({
      date: row[0] || "",
      employeeName: row[1] || "",
      inTime: row[2] || "",
      outTime: row[3] || "",
      inLocation: row[4] || "",
      outLocation: row[5] || "",
      totalMinutes: parseInt(row[6]) || 0,
      totalHours: row[7] || "",
    }));

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
