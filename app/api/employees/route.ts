import { NextRequest, NextResponse } from "next/server";
import { addEmployee, getEmployees, deleteEmployee } from "@/lib/employees";

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID not configured" },
        { status: 500 }
      );
    }

    // Get employees directly - no cache
    const employees = await getEmployees(spreadsheetId);

    return NextResponse.json(employees, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, position, role, status, totalWorkingDays, fixedInTime, fixedOutTime, perMinuteRate, fixedSalary, username, password } = body;

    if (!name || !position || !totalWorkingDays || !fixedInTime || !fixedOutTime) {
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

    const employeeId = await addEmployee(spreadsheetId, {
      name,
      position,
      role: role === "admin" ? "admin" : "user",
      status: status === "inactive" ? "inactive" : "active",
      totalWorkingDays: parseInt(totalWorkingDays),
      fixedInTime,
      fixedOutTime,
      perMinuteRate: parseFloat(perMinuteRate) || 0,
      fixedSalary: parseFloat(fixedSalary) || 0,
      username: username || "",
      password: password || "",
    });

    return NextResponse.json({ success: true, id: employeeId });
  } catch (error) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      { error: "Failed to add employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("id");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID required" },
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

    await deleteEmployee(spreadsheetId, employeeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
