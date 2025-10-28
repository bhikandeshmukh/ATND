import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * Notification types
 */
export enum NotificationType {
    LEAVE_REQUEST = "leave_request",
    LEAVE_APPROVED = "leave_approved",
    LEAVE_REJECTED = "leave_rejected",
    NIGHT_DUTY_REQUEST = "night_duty_request",
    NIGHT_DUTY_APPROVED = "night_duty_approved",
    NIGHT_DUTY_REJECTED = "night_duty_rejected",
    ATTENDANCE_MODIFIED = "attendance_modified",
    LATE_ARRIVAL = "late_arrival",
    PASSWORD_RESET = "password_reset",
    SYSTEM_ALERT = "system_alert",
}

/**
 * Notification interface
 */
export interface Notification {
    id: string;
    userId: string; // Employee ID
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>; // Additional data as JSON
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

/**
 * Ensure Notifications sheet exists
 */
async function ensureNotificationsSheet(spreadsheetId: string): Promise<void> {
    const sheetName = "Notifications";
    const expectedHeaders = [
        "ID",
        "User ID",
        "Type",
        "Title",
        "Message",
        "Data",
        "Is Read",
        "Created At",
        "Read At",
    ];

    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const existingSheet = response.data.sheets?.find(
            (sheet) => sheet.properties?.title === sheetName
        );

        if (existingSheet) {
            return; // Sheet already exists
        }

        // Create new sheet with headers
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: sheetName },
                        },
                    },
                ],
            },
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1:I1`,
            valueInputOption: "RAW",
            requestBody: {
                values: [expectedHeaders],
            },
        });

        console.log("✅ Created Notifications sheet");
    } catch (error) {
        console.error("Error ensuring notifications sheet:", error);
        throw error;
    }
}

/**
 * Create a new notification
 */
export async function createNotification(
    spreadsheetId: string,
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
): Promise<string> {
    await ensureNotificationsSheet(spreadsheetId);

    // Generate notification ID
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Notifications!A:A",
    });

    const rows = response.data.values || [];
    const newId = `N${String(rows.length).padStart(5, "0")}`;

    const now = new Date().toISOString();

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Notifications!A:I",
        valueInputOption: "RAW",
        requestBody: {
            values: [
                [
                    newId,
                    notification.userId,
                    notification.type,
                    notification.title,
                    notification.message,
                    notification.data ? JSON.stringify(notification.data) : "",
                    "FALSE", // isRead
                    now,
                    "", // readAt
                ],
            ],
        },
    });

    console.log(`✅ Created notification ${newId} for user ${notification.userId}`);
    return newId;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
    spreadsheetId: string,
    userId: string,
    unreadOnly: boolean = false
): Promise<Notification[]> {
    await ensureNotificationsSheet(spreadsheetId);

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Notifications!A2:I",
    });

    const rows = response.data.values || [];

    const notifications: Notification[] = rows
        .filter((row) => row[1] === userId)
        .map((row) => ({
            id: row[0] || "",
            userId: row[1] || "",
            type: row[2] as NotificationType,
            title: row[3] || "",
            message: row[4] || "",
            data: row[5] ? JSON.parse(row[5]) : undefined,
            isRead: row[6] === "TRUE",
            createdAt: row[7] || "",
            readAt: row[8] || undefined,
        }))
        .reverse(); // Most recent first

    if (unreadOnly) {
        return notifications.filter((n) => !n.isRead);
    }

    return notifications;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
    spreadsheetId: string,
    notificationId: string
): Promise<void> {
    await ensureNotificationsSheet(spreadsheetId);

    // Find the row with matching ID
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Notifications!A:A",
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === notificationId) {
            rowIndex = i + 1; // +1 because sheets are 1-indexed
            break;
        }
    }

    if (rowIndex === -1) {
        throw new Error(`Notification not found: ${notificationId}`);
    }

    const now = new Date().toISOString();

    // Update isRead and readAt
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Notifications!G${rowIndex}:I${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
            values: [["TRUE", now]],
        },
    });

    console.log(`✅ Marked notification ${notificationId} as read`);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
    spreadsheetId: string,
    userId: string
): Promise<number> {
    const notifications = await getUserNotifications(spreadsheetId, userId, true);

    for (const notification of notifications) {
        await markNotificationAsRead(spreadsheetId, notification.id);
    }

    return notifications.length;
}

/**
 * Delete old notifications (cleanup)
 */
export async function deleteOldNotifications(
    spreadsheetId: string,
    daysOld: number = 30
): Promise<number> {
    await ensureNotificationsSheet(spreadsheetId);

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Notifications!A2:I",
    });

    const rows = response.data.values || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    // Delete from bottom to top to avoid index shifting
    for (let i = rows.length - 1; i >= 0; i--) {
        const createdAt = new Date(rows[i][7]);
        if (createdAt < cutoffDate) {
            // Delete this row
            const sheetId = await getSheetId(spreadsheetId, "Notifications");
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            deleteDimension: {
                                range: {
                                    sheetId: sheetId,
                                    dimension: "ROWS",
                                    startIndex: i + 1, // +1 for header
                                    endIndex: i + 2,
                                },
                            },
                        },
                    ],
                },
            });
            deletedCount++;
        }
    }

    console.log(`✅ Deleted ${deletedCount} old notifications`);
    return deletedCount;
}

async function getSheetId(spreadsheetId: string, sheetName: string): Promise<number> {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = response.data.sheets?.find((s) => s.properties?.title === sheetName);
    return sheet?.properties?.sheetId || 0;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(
    spreadsheetId: string,
    userId: string
): Promise<number> {
    const unreadNotifications = await getUserNotifications(spreadsheetId, userId, true);
    return unreadNotifications.length;
}
