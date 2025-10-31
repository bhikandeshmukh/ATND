import { NextRequest, NextResponse } from "next/server";
import { updateCheckOut } from "@/lib/firebase/attendance";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeName, date, outTime, outLocation, modifiedBy } = body;

    if (!employeeName || !date || !outTime || !outLocation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await updateCheckOut(
      employeeName,
      date,
      outTime,
      outLocation,
      modifiedBy || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance record" },
      { status: 500 }
    );
  }
}
