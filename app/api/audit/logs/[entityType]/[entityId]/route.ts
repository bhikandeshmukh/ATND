import { NextRequest, NextResponse } from "next/server";
import { getEntityAuditLogs, EntityType } from "@/lib/audit/service";

/**
 * Get audit logs for a specific entity
 * GET /api/audit/logs/Attendance/2025-01-15_001
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { entityType: string; entityId: string } }
) {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        if (!spreadsheetId) {
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        const { entityType, entityId } = params;

        const logs = await getEntityAuditLogs(
            spreadsheetId,
            entityType as EntityType,
            entityId
        );

        return NextResponse.json({
            logs,
            total: logs.length,
        });
    } catch (error) {
        console.error("Error fetching entity audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
