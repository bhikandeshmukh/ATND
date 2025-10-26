import { NextRequest, NextResponse } from "next/server";
import { addNightDutyRequest, getAllNightDutyRequests } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, reason } = body;

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

    await addNightDutyRequest(spreadsheetId, {
      employeeName,
      date,
      reason: reason || "Night duty request",
      status: "pending",
      requestedDate: new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error adding night duty request:", error);
    
    // Check if it's a duplicate error
    if (error?.message?.includes("already exists")) {
      return NextResponse.json(
        { error: "Night duty request already exists for this date" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add night duty request" },
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

    const requests = await getAllNightDutyRequests(spreadsheetId);
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching night duty requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch night duty requests" },
      { status: 500 }
    );
  }
}
