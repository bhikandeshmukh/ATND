/**
 * Script to initialize all Google Sheets for advanced features
 * 
 * Usage: npx tsx scripts/init-sheets.ts
 */

// IMPORTANT: Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// Verify environment variables are loaded
if (!process.env.GOOGLE_SPREADSHEET_ID) {
    console.error("❌ Error: GOOGLE_SPREADSHEET_ID environment variable is not set");
    console.error("\nPlease set it in your .env.local file:");
    console.error("GOOGLE_SPREADSHEET_ID=your-spreadsheet-id");
    process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_EMAIL) {
    console.error("❌ Error: GOOGLE_CLIENT_EMAIL environment variable is not set");
    console.error("\nPlease set it in your .env.local file:");
    console.error("GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com");
    process.exit(1);
}

if (!process.env.GOOGLE_PRIVATE_KEY) {
    console.error("❌ Error: GOOGLE_PRIVATE_KEY environment variable is not set");
    console.error("\nPlease set it in your .env.local file:");
    console.error('GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    process.exit(1);
}

async function main() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

    console.log("📊 Google Spreadsheet ID:", spreadsheetId);
    console.log("");

    try {
        // Dynamic import AFTER env vars are loaded
        const { initializeAllSheets, checkSheetsExist } = await import("../lib/sheets/init");

        // Check current state
        console.log("🔍 Checking existing sheets...\n");
        const { allExist, missing } = await checkSheetsExist(spreadsheetId);

        if (allExist) {
            console.log("✅ All required sheets already exist!");
            console.log("\nDo you want to re-initialize them? (This will update headers if needed)");
            console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            console.log("Missing sheets:", missing.join(", "));
            console.log("");
        }

        // Initialize all sheets
        await initializeAllSheets(spreadsheetId);

        console.log("\n🎉 Setup complete! Your attendance system is ready with advanced features.");
        console.log("\nNext steps:");
        console.log("  1. Configure email service in .env.local (optional)");
        console.log("  2. Start the development server: npm run dev");
        console.log("  3. Test the new features");

    } catch (error) {
        console.error("\n❌ Failed to initialize sheets:");
        console.error(error);
        process.exit(1);
    }
}

main();
