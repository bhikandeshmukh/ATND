import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Helper function to convert column number to letter (1=A, 2=B, etc.)
function getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
        const remainder = (columnNumber - 1) % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
}

/**
 * Generic function to create or update a sheet with headers
 */
async function ensureSheet(
    spreadsheetId: string,
    sheetName: string,
    headers: string[]
): Promise<void> {
    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const existingSheet = response.data.sheets?.find(
            (sheet) => sheet.properties?.title === sheetName
        );

        const lastColumn = getColumnLetter(headers.length);

        if (existingSheet) {
            // Check and update headers if needed
            const headerResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A1:${lastColumn}1`,
            });

            const currentHeaders = headerResponse.data.values?.[0] || [];
            const needsUpdate =
                currentHeaders.length !== headers.length ||
                !headers.every((header, index) => currentHeaders[index] === header);

            if (needsUpdate) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A1:${lastColumn}1`,
                    valueInputOption: "RAW",
                    requestBody: {
                        values: [headers],
                    },
                });
                console.log(`✅ Updated headers for sheet: ${sheetName}`);
            } else {
                console.log(`✓ Sheet already exists with correct headers: ${sheetName}`);
            }
        } else {
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
                range: `${sheetName}!A1:${lastColumn}1`,
                valueInputOption: "RAW",
                requestBody: {
                    values: [headers],
                },
            });
            console.log(`✅ Created new sheet: ${sheetName}`);
        }
    } catch (error) {
        console.error(`Error ensuring sheet ${sheetName}:`, error);
        throw error;
    }
}

/**
 * Create Reset_Tokens sheet for password reset functionality
 */
export async function ensureResetTokensSheet(spreadsheetId: string): Promise<void> {
    const headers = [
        "ID",
        "User ID",
        "Token",
        "Expires At",
        "Used",
        "Created At",
        "IP Address"
    ];
    await ensureSheet(spreadsheetId, "Reset_Tokens", headers);
}

/**
 * Create Audit_Logs sheet for tracking all modifications
 */
export async function ensureAuditLogsSheet(spreadsheetId: string): Promise<void> {
    const headers = [
        "ID",
        "Timestamp",
        "Action",
        "Entity Type",
        "Entity ID",
        "Employee ID",
        "Performed By",
        "Performed By ID",
        "Field Changed",
        "Old Value",
        "New Value",
        "Reason",
        "IP Address",
        "User Agent"
    ];
    await ensureSheet(spreadsheetId, "Audit_Logs", headers);
}

/**
 * Create Shifts sheet for shift management
 */
export async function ensureShiftsSheet(spreadsheetId: string): Promise<void> {
    const headers = [
        "ID",
        "Name",
        "Start Time",
        "End Time",
        "Break Duration",
        "Working Days",
        "Grace Time",
        "Is Active",
        "Created At",
        "Updated At"
    ];
    await ensureSheet(spreadsheetId, "Shifts", headers);
}

/**
 * Create Overtime sheet for overtime records
 */
export async function ensureOvertimeSheet(spreadsheetId: string): Promise<void> {
    const headers = [
        "ID",
        "Employee ID",
        "Employee Name",
        "Date",
        "Regular Minutes",
        "Overtime Minutes",
        "Overtime Type",
        "Overtime Rate",
        "Overtime Pay",
        "Status",
        "Approved By",
        "Approved At",
        "Reason",
        "Created At"
    ];
    await ensureSheet(spreadsheetId, "Overtime", headers);
}

/**
 * Create Overtime_Rules sheet for overtime calculation rules
 */
export async function ensureOvertimeRulesSheet(spreadsheetId: string): Promise<void> {
    const headers = [
        "ID",
        "Name",
        "Daily Threshold",
        "Weekly Threshold",
        "Regular Rate",
        "Holiday Rate",
        "Requires Approval",
        "Auto Approve Under",
        "Is Active"
    ];
    await ensureSheet(spreadsheetId, "Overtime_Rules", headers);

    // Create default overtime rule if sheet is empty
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Overtime_Rules!A2:A2",
        });

        if (!response.data.values || response.data.values.length === 0) {
            // Add default rule
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: "Overtime_Rules!A:I",
                valueInputOption: "RAW",
                requestBody: {
                    values: [[
                        "OR001",
                        "Default Overtime Rule",
                        480,    // 8 hours daily threshold
                        2400,   // 40 hours weekly threshold
                        1.5,    // 1.5x regular rate
                        2.0,    // 2.0x holiday rate
                        "TRUE", // Requires approval
                        60,     // Auto-approve under 60 minutes
                        "TRUE"  // Is active
                    ]],
                },
            });
            console.log("✅ Created default overtime rule");
        }
    } catch (error) {
        console.error("Error creating default overtime rule:", error);
    }
}

/**
 * Create Holidays sheet for holiday management
 */
export async function ensureHolidaysSheet(spreadsheetId: string): Promise<void> {
    const headers = [
        "ID",
        "Date",
        "Name",
        "Type",
        "Description",
        "Is Recurring",
        "Recurrence Rule",
        "Locations",
        "Is Active",
        "Created At",
        "Updated At"
    ];
    await ensureSheet(spreadsheetId, "Holidays", headers);
}

/**
 * Create Notifications sheet for in-app notifications
 */
export async function ensureNotificationsSheet(spreadsheetId: string): Promise<void> {
    const headers = [
        "ID",
        "User ID",
        "Type",
        "Title",
        "Message",
        "Data",
        "Is Read",
        "Created At",
        "Read At"
    ];
    await ensureSheet(spreadsheetId, "Notifications", headers);
}

/**
 * Update existing Employees sheet with new columns
 */
export async function updateEmployeesSheet(spreadsheetId: string): Promise<void> {
    const newHeaders = [
        "ID",
        "Name",
        "Position",
        "Role",
        "Status",
        "Total Working Days",
        "Fixed In Time",
        "Fixed Out Time",
        "Per Minute Rate",
        "Fixed Salary",
        "Username",
        "Password",
        "Email",                    // NEW
        "Shift ID",                 // NEW
        "Notifications Enabled",    // NEW
        "Notification Types"        // NEW
    ];

    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const existingSheet = response.data.sheets?.find(
            (sheet) => sheet.properties?.title === "Employees"
        );

        if (!existingSheet) {
            console.log("⚠️  Employees sheet does not exist. It will be created on first use.");
            return;
        }

        // Get current headers
        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Employees!A1:Z1",
        });

        const currentHeaders = headerResponse.data.values?.[0] || [];

        // Check if new columns already exist
        if (currentHeaders.length >= newHeaders.length) {
            console.log("✓ Employees sheet already has new columns");
            return;
        }

        // Update headers
        const lastColumn = getColumnLetter(newHeaders.length);
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Employees!A1:${lastColumn}1`,
            valueInputOption: "RAW",
            requestBody: {
                values: [newHeaders],
            },
        });

        console.log("✅ Updated Employees sheet with new columns: Email, Shift ID, Notifications Enabled, Notification Types");
    } catch (error) {
        console.error("Error updating Employees sheet:", error);
        throw error;
    }
}

/**
 * Update monthly attendance sheets with new columns
 * Note: This updates the template for future sheets
 */
export async function updateMonthlyAttendanceTemplate(): Promise<void> {
    // This will be handled by the getOrCreateMonthlySheet function
    // We'll update that function to include the new columns
    console.log("ℹ️  Monthly attendance sheets will be updated automatically when created/accessed");
}

/**
 * Initialize all new sheets for advanced features
 */
export async function initializeAllSheets(spreadsheetId: string): Promise<void> {
    console.log("🚀 Initializing Google Sheets for advanced features...\n");

    try {
        // Create new sheets (only required ones)
        await ensureAuditLogsSheet(spreadsheetId);
        await ensureNotificationsSheet(spreadsheetId);

        // Update existing sheets
        await updateEmployeesSheet(spreadsheetId);

        console.log("\n✅ All sheets initialized successfully!");
        console.log("\nCreated/Updated sheets:");
        console.log("  • Audit_Logs");
        console.log("  • Notifications");
        console.log("  • Employees (updated with new columns)");
        console.log("\nNote: Monthly attendance sheets will be updated automatically when accessed.");
    } catch (error) {
        console.error("\n❌ Error initializing sheets:", error);
        throw error;
    }
}

/**
 * Check if all required sheets exist
 */
export async function checkSheetsExist(spreadsheetId: string): Promise<{
    allExist: boolean;
    missing: string[];
}> {
    const requiredSheets = [
        "Audit_Logs",
        "Notifications"
    ];

    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const existingSheets = response.data.sheets?.map(s => s.properties?.title || "") || [];

        const missing = requiredSheets.filter(sheet => !existingSheets.includes(sheet));

        return {
            allExist: missing.length === 0,
            missing
        };
    } catch (error) {
        console.error("Error checking sheets:", error);
        throw error;
    }
}
