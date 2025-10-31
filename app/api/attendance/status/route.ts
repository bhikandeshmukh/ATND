import { NextRequest, NextResponse } from "next/server";
import { getAttendanceStatus } from "@/lib/firebase/attendance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date } = body;

    if (!employeeName || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const status = await getAttendanceStatus(employeeName, date);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking attendance status:", error);
    return NextResponse.json(
      { error: "Failed to check attendance status" },
      { status: 500 }
    );
  }
}
