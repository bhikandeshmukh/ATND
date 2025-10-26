import { NextRequest, NextResponse } from "next/server";
import { addLeaveRecord, getAllLeaves } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, leaveType, startDate, endDate, reason } = body;

    if (!employeeName || !leaveType || !startDate || !endDate || !reason) {
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

    await addLeaveRecord(spreadsheetId, {
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "pending",
      appliedDate: new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding leave record:", error);
    return NextResponse.json(
      { error: "Failed to add leave record" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID not configured" },
        { status: 500 }
      );
    }

    const leaves = await getAllLeaves(spreadsheetId);
    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaves" },
      { status: 500 }
    );
  }
}
