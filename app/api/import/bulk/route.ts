import { NextRequest, NextResponse } from "next/server";
import { addEmployee as addFirebaseEmployee } from "@/lib/firebase/employees";
import { addCheckIn } from "@/lib/firebase/attendance";
import { addLeaveRequest } from "@/lib/firebase/leaves";
import { addNightDutyRequest } from "@/lib/firebase/nightDuty";
import { createNotification } from "@/lib/firebase/notifications";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: "Missing file or type" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file is empty or invalid" },
        { status: 400 }
      );
    }

    const headers = lines[0].split(",").map(h => h.trim());
    const dataLines = lines.slice(1);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const values = line.split(",").map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      try {
        if (type === "employees") {
          await addFirebaseEmployee({
            name: row["Name"],
            position: row["Position"],
            role: row["Role"]?.toLowerCase() === "admin" ? "admin" : "user",
            status: row["Status"]?.toLowerCase() === "inactive" ? "inactive" : "active",
            totalWorkingDays: parseInt(row["Total Working Days"]) || 26,
            fixedInTime: row["Fixed In Time"] || "09:00:00 AM",
            fixedOutTime: row["Fixed Out Time"] || "07:00:00 PM",
            perMinuteRate: parseFloat(row["Per Minute Rate"]) || 0,
            fixedSalary: parseFloat(row["Fixed Salary"]) || 0,
            username: row["Username"],
            password: row["Password"],
          });
          success++;
        } else if (type === "attendance") {
          await addCheckIn({
            employeeName: row["Employee Name"],
            date: row["Date"],
            inTime: row["In Time"],
            outTime: row["Out Time"],
            inLocation: row["In Location"],
            outLocation: row["Out Location"],
            totalMinutes: parseInt(row["Total Minutes"]) || 0,
            totalHours: row["Total Hours"],
            modifiedBy: row["Modified By"],
            overtimeMinutes: parseInt(row["Overtime Minutes"]) || 0,
            overtimePay: parseFloat(row["Overtime Pay"]) || 0,
            isHoliday: row["Is Holiday"],
          });
          success++;
        } else if (type === "leaves") {
          await addLeaveRequest({
            employeeName: row["Employee Name"],
            leaveType: row["Leave Type"],
            startDate: row["Start Date"],
            endDate: row["End Date"],
            reason: row["Reason"],
            status: row["Status"] || "pending",
            paymentStatus: row["Payment Status"],
            appliedDate: row["Applied Date"] || new Date().toISOString().split("T")[0],
          });
          success++;
        } else if (type === "nightDuty") {
          await addNightDutyRequest({
            employeeName: row["Employee Name"],
            date: row["Date"],
            startTime: row["Start Time"] || "09:00:00 PM",
            endTime: row["End Time"] || "07:00:00 AM",
            reason: row["Reason"],
            status: row["Status"] || "pending",
            appliedDate: row["Applied Date"] || new Date().toISOString().split("T")[0],
            requestedBy: row["Requested By"] || row["Employee Name"],
          });
          success++;
        } else if (type === "notifications") {
          const sendToAll = row["Send To All"]?.toLowerCase() === "yes";
          
          if (sendToAll) {
            // Send to all users - would need to fetch all employees
            // For now, skip or implement separately
            errors.push(`Row ${i + 2}: Send to all not implemented in bulk import`);
            failed++;
          } else {
            await createNotification({
              userId: row["User ID"],
              type: row["Type"],
              title: row["Title"],
              message: row["Message"],
            });
            success++;
          }
        }
      } catch (error: any) {
        failed++;
        errors.push(`Row ${i + 2}: ${error.message || "Import failed"}`);
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors,
      message: `Imported ${success} records successfully${failed > 0 ? `, ${failed} failed` : ""}`,
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
