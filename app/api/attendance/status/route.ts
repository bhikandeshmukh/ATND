import { NextRequest, NextResponse } from "next/server";
import { checkTodayAttendanceStatus } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date } = body;

    if (!employeeName || !date) {
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

    const status = await checkTodayAttendanceStatus(spreadsheetId, employeeName, date);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking attendance status:", error);
    return NextResponse.json(
      { error: "Failed to check attendance status" },
      { status: 500 }
    );
  }
}
