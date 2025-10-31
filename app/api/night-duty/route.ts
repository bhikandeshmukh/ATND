import { NextRequest, NextResponse } from "next/server";
import { addNightDutyRequest, getAllNightDutyRequests } from "@/lib/firebase/nightDuty";
import { getAllEmployees } from "@/lib/firebase/employees";
import { createNotification, NotificationType } from "@/lib/notifications/service";
import { cache, CacheKeys, CacheTags, invalidateRelated } from "@/lib/cache/advanced-cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, reason, requestedBy } = body;

    if (!employeeName || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await addNightDutyRequest({
      employeeName,
      date,
      startTime: "09:00:00 PM",
      endTime: "07:00:00 AM",
      reason: reason || '',
      status: "Pending",
      appliedDate: new Date().toISOString().split("T")[0],
      requestedBy: requestedBy || employeeName,
    });

    // Send notifications to all admins
    try {
      const employees = await getAllEmployees();
      const admins = employees.filter((emp) => emp.role === "admin");

      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (spreadsheetId) {
        for (const admin of admins) {
          await createNotification(spreadsheetId, {
            userId: admin.id || '',
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
      }
    } catch (notifError) {
      console.error("Error sending notifications:", notifError);
      // Don't fail the request if notification fails
    }

    // Invalidate night duty cache
    invalidateRelated.nightDuty();

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
    // Use cache with 30 second TTL
    const requests = await cache.getOrSet(
      CacheKeys.nightDuty(),
      () => getAllNightDutyRequests(),
      { ttl: 30000, tags: [CacheTags.NIGHT_DUTY] }
    );
    
    console.log(`Fetched ${requests.length} night duty requests (cached)`);
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching night duty requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch night duty requests" },
      { status: 500 }
    );
  }
}
