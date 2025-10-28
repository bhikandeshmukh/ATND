import { NextRequest, NextResponse } from "next/server";
import { updateNightDutyStatus, getAllNightDutyRequests } from "@/lib/googleSheets";
import { getEmployees } from "@/lib/employees";
import { createNotification, NotificationType } from "@/lib/notifications/service";
import { logNightDutyAction } from "@/lib/audit/service";
import { cache, CacheKeys } from "@/lib/cache/simple-cache";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, approvedBy, approvedById } = body;

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

    // Get request details before updating
    const requests = await getAllNightDutyRequests(spreadsheetId);
    const nightDutyRequest = requests.find((r) => r.id === id);

    if (!nightDutyRequest) {
      return NextResponse.json(
        { error: "Night duty request not found" },
        { status: 404 }
      );
    }

    await updateNightDutyStatus(spreadsheetId, id, status, approvedBy);

    // Send notification to employee
    try {
      const employees = await getEmployees(spreadsheetId);
      const employee = employees.find((emp) => emp.name === nightDutyRequest.employeeName);

      if (employee) {
        const notifType = status === "approved" 
          ? NotificationType.NIGHT_DUTY_APPROVED 
          : NotificationType.NIGHT_DUTY_REJECTED;

        const notifTitle = status === "approved" 
          ? "Night Duty Approved ✅" 
          : "Night Duty Rejected ❌";

        const notifMessage = status === "approved"
          ? `Your night duty request for ${nightDutyRequest.date} has been approved by ${approvedBy || "Admin"}. Attendance has been automatically recorded.`
          : `Your night duty request for ${nightDutyRequest.date} has been rejected by ${approvedBy || "Admin"}`;

        await createNotification(spreadsheetId, {
          userId: employee.id,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          data: {
            requestId: id,
            date: nightDutyRequest.date,
            status,
            approvedBy,
          },
        });

        // Create audit log
        await logNightDutyAction(spreadsheetId, {
          requestId: id,
          employeeId: employee.id,
          employeeName: employee.name,
          action: status === "approved" ? "APPROVE" : "REJECT",
          performedBy: approvedBy || "Admin",
          performedById: approvedById || "ADMIN",
        });
      }
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
      // Don't fail the request if notification fails
    }

    // Clear night duty cache
    cache.delete(CacheKeys.nightDuty());

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating night duty status:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update night duty status" },
      { status: 500 }
    );
  }
}
