import { NextRequest, NextResponse } from "next/server";
import { addLeaveRecord, getAllLeaves } from "@/lib/googleSheets";
import { getEmployees } from "@/lib/employees";
import { createNotification, NotificationType } from "@/lib/notifications/service";
import { cache, CacheKeys } from "@/lib/cache/simple-cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, leaveType, startDate, endDate, reason, employeeId } = body;

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

    // Send notifications to all admins
    try {
      const employees = await getEmployees(spreadsheetId);
      const admins = employees.filter((emp) => emp.role === "admin");

      for (const admin of admins) {
        await createNotification(spreadsheetId, {
          userId: admin.id,
          type: NotificationType.LEAVE_REQUEST,
          title: "New Leave Request",
          message: `${employeeName} has requested ${leaveType} leave from ${startDate} to ${endDate}`,
          data: {
            employeeName,
            leaveType,
            startDate,
            endDate,
            reason,
          },
        });
      }
    } catch (notifError) {
      console.error("Error sending notifications:", notifError);
      // Don't fail the request if notification fails
    }

    // Clear leaves cache
    cache.delete(CacheKeys.leaves());

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

    // Check cache
    const cacheKey = CacheKeys.leaves();
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    const leaves = await getAllLeaves(spreadsheetId);
    
    // Cache for 30 seconds
    cache.set(cacheKey, leaves, 30000);
    
    return NextResponse.json(leaves, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaves" },
      { status: 500 }
    );
  }
}
