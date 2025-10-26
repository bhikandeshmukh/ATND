import { NextRequest, NextResponse } from "next/server";
import { addCheckInRecord } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, inTime, inLocation, modifiedBy } = body;

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

    await addCheckInRecord(spreadsheetId, {
      date,
      employeeName,
      inTime,
      inLocation,
      modifiedBy: modifiedBy || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding check-in:", error);
    return NextResponse.json(
      { error: "Failed to add check-in record" },
      { status: 500 }
    );
  }
}
