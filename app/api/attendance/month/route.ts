import { NextRequest, NextResponse } from "next/server";
import { getSpecificMonthAttendance } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: "Year and month required" },
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

    const records = await getSpecificMonthAttendance(spreadsheetId, year, month);
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
