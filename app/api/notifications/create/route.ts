import { NextRequest, NextResponse } from "next/server";
import { createNotification, NotificationType } from "@/lib/notifications/service";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

/**
 * POST /api/notifications/create
 * Create a manual notification (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data, sendToAll } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    if (!sendToAll && !userId) {
      return NextResponse.json(
        { error: "User ID is required when not sending to all" },
        { status: 400 }
      );
    }

    // If sendToAll is true, we need to get all users
    if (sendToAll) {
      const { google } = await import("googleapis");
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });

      // Get all employees
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Employees!A2:A",
      });

      const employeeIds = (response.data.values || []).map((row) => row[0]);

      // Create notification for each user
      const notificationIds = await Promise.all(
        employeeIds.map((empId) =>
          createNotification(SPREADSHEET_ID, {
            userId: empId,
            type: (type as NotificationType) || NotificationType.SYSTEM_ALERT,
            title,
            message,
            data,
          })
        )
      );

      return NextResponse.json({
        success: true,
        message: `Notification sent to ${employeeIds.length} users`,
        count: employeeIds.length,
        notificationIds,
      });
    } else {
      // Create notification for single user
      const notificationId = await createNotification(SPREADSHEET_ID, {
        userId,
        type: (type as NotificationType) || NotificationType.SYSTEM_ALERT,
        title,
        message,
        data,
      });

      return NextResponse.json({
        success: true,
        message: "Notification created successfully",
        notificationId,
      });
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
