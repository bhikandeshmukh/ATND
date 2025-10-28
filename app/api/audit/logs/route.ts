import { NextRequest, NextResponse } from "next/server";
import { getAllAuditLogs, EntityType, AuditAction } from "@/lib/audit/service";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * Get audit logs with filters
 * GET /api/audit/logs?entityType=Attendance&action=UPDATE&startDate=2025-01-01&limit=50
 */
export async function GET(req: NextRequest) {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        if (!spreadsheetId) {
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        const searchParams = req.nextUrl.searchParams;

        const filters = {
            entityType: searchParams.get("entityType") as EntityType | undefined,
            action: searchParams.get("action") as AuditAction | undefined,
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
            limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100,
        };

        const logs = await getAllAuditLogs(spreadsheetId, filters);

        return NextResponse.json({
            logs,
            total: logs.length,
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
