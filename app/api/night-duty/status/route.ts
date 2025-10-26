import { NextRequest, NextResponse } from "next/server";
import { updateNightDutyStatus } from "@/lib/googleSheets";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, approvedBy } = body;

    if (!id || !status) {
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

    await updateNightDutyStatus(spreadsheetId, id, status, approvedBy);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating night duty status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update night duty status" },
      { status: 500 }
    );
  }
}
