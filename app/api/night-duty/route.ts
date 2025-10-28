import { NextRequest, NextResponse } from "next/server";
import { addNightDutyRequest, getAllNightDutyRequests } from "@/lib/googleSheets";
import { getEmployees } from "@/lib/employees";
import { createNotification, NotificationType } from "@/lib/notifications/service";
import { cache, CacheKeys } from "@/lib/cache/simple-cache";

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

    // Send notifications to all admins
    try {
      const employees = await getEmployees(spreadsheetId);
      const admins = employees.filter((emp) => emp.role === "admin");

      for (const admin of admins) {
        await createNotification(spreadsheetId, {
          userId: admin.id,
          type: NotificationType.NIGHT_DUTY_REQUEST,
          title: "New Night Duty Request",
          message: `${employeeName} has requested night duty for ${date}`,
          data: {
            employeeName,
            date,
            reason,
          },
        });
      }
    } catch (notifError) {
      console.error("Error sending notifications:", notifError);
      // Don't fail the request if notification fails
    }

    // Clear night duty cache
    cache.delete(CacheKeys.nightDuty());

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

    // Check cache
    const cacheKey = CacheKeys.nightDuty();
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    const requests = await getAllNightDutyRequests(spreadsheetId);
    
    // Cache for 30 seconds
    cache.set(cacheKey, requests, 30000);
    
    return NextResponse.json(requests, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error) {
    console.error("Error fetching night duty requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch night duty requests" },
      { status: 500 }
    );
  }
}
