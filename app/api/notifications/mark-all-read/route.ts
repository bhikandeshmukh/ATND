import { NextRequest, NextResponse } from "next/server";
import { markAllAsRead } from "@/lib/notifications/service";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for a user
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const count = await markAllAsRead(SPREADSHEET_ID, userId);

    return NextResponse.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
