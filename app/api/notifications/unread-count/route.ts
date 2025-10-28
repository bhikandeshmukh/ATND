import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/notifications/service";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// Mark route as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const count = await getUnreadCount(SPREADSHEET_ID, userId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
