/**
 * Script to initialize Notifications sheet
 * Run: npx tsx scripts/init-notifications.ts
 */

import { initializeAllSheets, ensureNotificationsSheet } from "../lib/sheets/init";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function main() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
        console.error("❌ GOOGLE_SPREADSHEET_ID not found in environment variables");
        process.exit(1);
    }

    console.log("🚀 Initializing Notifications sheet...\n");
    console.log(`Spreadsheet ID: ${spreadsheetId}\n`);

    try {
        // Initialize only Notifications sheet
        await ensureNotificationsSheet(spreadsheetId);

        console.log("\n✅ Notifications sheet initialized successfully!");
        console.log("\nYou can now:");
        console.log("  • Send notifications from admin panel");
        console.log("  • View notifications in user panel");
        console.log("  • Use notification bell in header");
    } catch (error) {
        console.error("\n❌ Error initializing Notifications sheet:", error);
        process.exit(1);
    }
}

main();
