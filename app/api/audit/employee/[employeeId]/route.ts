import { NextRequest, NextResponse } from "next/server";
import { getEmployeeAuditLogs } from "@/lib/audit/service";

/**
 * Get audit logs for a specific employee
 * GET /api/audit/employee/001?startDate=2025-01-01&endDate=2025-01-31
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { employeeId: string } }
) {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        if (!spreadsheetId) {
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        const { employeeId } = params;
        const { searchParams } = new URL(req.url);

        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;

        const logs = await getEmployeeAuditLogs(spreadsheetId, employeeId, startDate, endDate);

        return NextResponse.json({
            logs,
            total: logs.length,
        });
    } catch (error) {
        console.error("Error fetching employee audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
