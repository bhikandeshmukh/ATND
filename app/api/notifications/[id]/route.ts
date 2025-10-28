import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// Mark route as dynamic
export const dynamic = 'force-dynamic';

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const notificationId = params.id;

        // Find the row with matching ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Notifications!A:A",
        });

        const rows = response.data.values || [];
        let rowIndex = -1;

        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === notificationId) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex === -1) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        // Get sheet ID
        const sheetResponse = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });
        const sheet = sheetResponse.data.sheets?.find(
            (s) => s.properties?.title === "Notifications"
        );
        const sheetId = sheet?.properties?.sheetId || 0;

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: "ROWS",
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1,
                            },
                        },
                    },
                ],
            },
        });

        return NextResponse.json({
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json(
            { error: "Failed to delete notification" },
            { status: 500 }
        );
    }
}
