/**
 * Script to remove unwanted sheets from Google Spreadsheet
 * 
 * Usage: npx tsx scripts/cleanup-sheets.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Sheets to DELETE (unwanted sheets)
const SHEETS_TO_DELETE = [
    "Reset_Tokens",
    "Shifts",
    "Overtime",
    "Overtime_Rules",
    "Holidays",
];

async function deleteSheet(spreadsheetId: string, sheetName: string): Promise<boolean> {
    try {
        // Get sheet ID
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = response.data.sheets?.find(
            (s) => s.properties?.title === sheetName
        );

        if (!sheet || !sheet.properties?.sheetId) {
            console.log(`⚠️  Sheet "${sheetName}" not found - skipping`);
            return false;
        }

        const sheetId = sheet.properties.sheetId;

        // Delete the sheet
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteSheet: {
                            sheetId: sheetId,
                        },
                    },
                ],
            },
        });

        console.log(`✅ Deleted sheet: ${sheetName}`);
        return true;
    } catch (error) {
        console.error(`❌ Error deleting sheet "${sheetName}":`, error);
        return false;
    }
}

async function main() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
        console.error("❌ Error: GOOGLE_SPREADSHEET_ID not set");
        process.exit(1);
    }

    console.log("📊 Google Spreadsheet ID:", spreadsheetId);
    console.log("\n🗑️  Removing unwanted sheets...\n");

    let deletedCount = 0;

    for (const sheetName of SHEETS_TO_DELETE) {
        const deleted = await deleteSheet(spreadsheetId, sheetName);
        if (deleted) {
            deletedCount++;
        }
        // Small delay between deletions
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} sheets.`);
    console.log("\nRemaining sheets:");
    console.log("  • Employees");
    console.log("  • Monthly attendance sheets (2025-01, etc.)");
    console.log("  • Leaves");
    console.log("  • Night_Duty_Requests");
    console.log("  • Notifications");
    console.log("  • Audit_Logs");
}

main();
