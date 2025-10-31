import { NextRequest, NextResponse } from "next/server";
import { getMonthlyAttendance } from "@/lib/firebase/attendance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: "Year and month required" },
        { status: 400 }
      );
    }

    const records = await getMonthlyAttendance(year, month);
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
