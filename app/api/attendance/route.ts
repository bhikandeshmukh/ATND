import { NextRequest, NextResponse } from "next/server";
import { addCheckIn } from "@/lib/firebase/attendance";
import { getMonthlyAttendance } from "@/lib/firebase/attendance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, inTime, outTime, inLocation, outLocation } = body;

    if (!employeeName || !date || !inTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await addCheckIn({
      date,
      employeeName,
      inTime,
      outTime,
      inLocation: inLocation || "Not captured",
      outLocation: outLocation || "Not captured",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding attendance:", error);
    return NextResponse.json(
      { error: "Failed to add attendance record" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString();
    
    const records = await getMonthlyAttendance(year, month);

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
