import { NextRequest, NextResponse } from "next/server";
import { updateNightDutyStatus, getAllNightDutyRequests } from "@/lib/firebase/nightDuty";
import { getAllEmployees } from "@/lib/firebase/employees";
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

    // Get request details before updating
    const requests = await getAllNightDutyRequests();
    const nightDutyRequest = requests.find((r) => r.id === id);

    if (!nightDutyRequest) {
      return NextResponse.json(
        { error: "Night duty request not found" },
        { status: 404 }
      );
    }

    await updateNightDutyStatus(id, status, approvedBy);

    // Send notification to employee
    try {
      const employees = await getAllEmployees();
      const employee = employees.find((emp) => emp.name === nightDutyRequest.employeeName);

      if (employee) {
        const isApproved = status.toLowerCase() === "approved";
        
        const notifType = isApproved
          ? NotificationType.NIGHT_DUTY_APPROVED 
          : NotificationType.NIGHT_DUTY_REJECTED;

        const notifTitle = isApproved
          ? "Night Duty Approved ✅" 
          : "Night Duty Rejected ❌";

        const notifMessage = isApproved
          ? `Your night duty request for ${nightDutyRequest.date} has been approved by ${approvedBy || "Admin"}. Please check-in at office location. Your attendance will be recorded as 9:00 PM - 7:00 AM.`
          : `Your night duty request for ${nightDutyRequest.date} has been rejected by ${approvedBy || "Admin"}`;

        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        if (spreadsheetId) {
          await createNotification(spreadsheetId, {
            userId: employee.id || '',
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
          const auditAction = status.toLowerCase() === "approved" ? "APPROVE" : "REJECT";
          await logNightDutyAction(spreadsheetId, {
            requestId: id,
            employeeId: employee.id || '',
            employeeName: employee.name,
            action: auditAction,
            performedBy: approvedBy || "Admin",
            performedById: approvedById || "ADMIN",
          });
        }
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
