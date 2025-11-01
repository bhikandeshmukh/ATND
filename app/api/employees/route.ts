import { NextRequest, NextResponse } from "next/server";
import { addEmployee, getEmployees, deleteEmployee } from "@/lib/employees";
import { cache, CacheKeys, CacheTags, invalidateRelated } from "@/lib/cache/advanced-cache";

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Spreadsheet ID not configured" },
        { status: 500 }
      );
    }

    // Use cache with 60 second TTL
    const employees = await cache.getOrSet(
      CacheKeys.employees(),
      () => getEmployees(spreadsheetId),
      { ttl: 60000, tags: [CacheTags.EMPLOYEES] }
    );

    return NextResponse.json(employees);
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

    // Check for duplicate name before creating
    const employees = await getEmployees(spreadsheetId);
    const duplicateExists = employees.some(emp => emp.name.toLowerCase() === name.toLowerCase());
    
    if (duplicateExists) {
      return NextResponse.json(
        { error: `Employee with name "${name}" already exists. Please use a different name.` },
        { status: 400 }
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

    // Invalidate employee cache
    invalidateRelated.employee();

    return NextResponse.json({ success: true, id: employeeId });
  } catch (error: any) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add employee" },
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

    // Invalidate employee cache
    invalidateRelated.employee();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
