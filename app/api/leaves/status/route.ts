import { NextRequest, NextResponse } from "next/server";
import { updateLeaveStatus } from "@/lib/googleSheets";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, paymentStatus, approvedBy } = body;

    console.log("Received update request:", { id, status, paymentStatus, approvedBy });

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

    await updateLeaveStatus(spreadsheetId, id, status, paymentStatus, approvedBy);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating leave status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update leave status" },
      { status: 500 }
    );
  }
}
