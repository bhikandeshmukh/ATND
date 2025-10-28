import { NextRequest, NextResponse } from "next/server";
import { initializeAllSheets, checkSheetsExist } from "@/lib/sheets/init";

export async function POST(req: NextRequest) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "GOOGLE_SPREADSHEET_ID not configured" },
        { status: 500 }
      );
    }

    // Check authentication (admin only)
    // TODO: Add proper authentication check here
    
    // Initialize all sheets
    await initializeAllSheets(spreadsheetId);

    return NextResponse.json({
      success: true,
      message: "All sheets initialized successfully"
    });
  } catch (error) {
    console.error("Error initializing sheets:", error);
    return NextResponse.json(
      { error: "Failed to initialize sheets", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "GOOGLE_SPREADSHEET_ID not configured" },
        { status: 500 }
      );
    }

    // Check which sheets exist
    const status = await checkSheetsExist(spreadsheetId);

    return NextResponse.json({
      spreadsheetId,
      ...status
    });
  } catch (error) {
    console.error("Error checking sheets:", error);
    return NextResponse.json(
      { error: "Failed to check sheets", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
