import { NextRequest, NextResponse } from "next/server";
import { markNotificationAsRead } from "@/lib/notifications/service";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

/**
 * PUT /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;

    await markNotificationAsRead(SPREADSHEET_ID, notificationId);

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
