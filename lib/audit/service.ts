import { google } from "googleapis";
import { logger } from "../logger";

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * Audit action types
 */
export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
}

/**
 * Entity types that can be audited
 */
export enum EntityType {
    ATTENDANCE = "Attendance",
    LEAVE = "Leave",
    NIGHT_DUTY = "Night_Duty",
    EMPLOYEE = "Employee",
    NOTIFICATION = "Notification",
}

/**
 * Audit log entry interface
 */
export interface AuditLog {
    id: string;
    timestamp: string;
    action: AuditAction;
    entityType: EntityType;
    entityId: string;
    employeeId: string;
    employeeName: string;
    performedBy: string;
    performedById: string;
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
    spreadsheetId: string,
    log: Omit<AuditLog, "id" | "timestamp">
): Promise<string> {
    try {
        // Get current row count to generate ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Audit_Logs!A:A",
        });

        const rows = response.data.values || [];
        const newId = `AL${String(rows.length).padStart(5, "0")}`;

        const now = new Date().toISOString();

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Audit_Logs!A:N",
            valueInputOption: "RAW",
            requestBody: {
                values: [
                    [
                        newId,
                        now,
                        log.action,
                        log.entityType,
                        log.entityId,
                        log.employeeId,
                        log.employeeName,
                        log.performedBy,
                        log.performedById,
                        log.fieldChanged || "",
                        log.oldValue || "",
                        log.newValue || "",
                        log.reason || "",
                        log.ipAddress || "",
                        log.userAgent || "",
                    ],
                ],
            },
        });

        logger.info(`Audit log created: ${newId} - ${log.action} ${log.entityType}`);
        return newId;
    } catch (error) {
        logger.error("Error creating audit log:", error);
        throw error;
    }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
    spreadsheetId: string,
    entityType: EntityType,
    entityId: string
): Promise<AuditLog[]> {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Audit_Logs!A2:O",
        });

        const rows = response.data.values || [];

        const logs: AuditLog[] = rows
            .filter((row) => row[3] === entityType && row[4] === entityId)
            .map((row) => ({
                id: row[0] || "",
                timestamp: row[1] || "",
                action: row[2] as AuditAction,
                entityType: row[3] as EntityType,
                entityId: row[4] || "",
                employeeId: row[5] || "",
                employeeName: row[6] || "",
                performedBy: row[7] || "",
                performedById: row[8] || "",
                fieldChanged: row[9] || undefined,
                oldValue: row[10] || undefined,
                newValue: row[11] || undefined,
                reason: row[12] || undefined,
                ipAddress: row[13] || undefined,
                userAgent: row[14] || undefined,
            }))
            .reverse(); // Most recent first

        return logs;
    } catch (error) {
        logger.error("Error fetching entity audit logs:", error);
        throw error;
    }
}

/**
 * Get audit logs for a specific employee
 */
export async function getEmployeeAuditLogs(
    spreadsheetId: string,
    employeeId: string,
    startDate?: string,
    endDate?: string
): Promise<AuditLog[]> {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Audit_Logs!A2:O",
        });

        const rows = response.data.values || [];

        let logs: AuditLog[] = rows
            .filter((row) => row[5] === employeeId)
            .map((row) => ({
                id: row[0] || "",
                timestamp: row[1] || "",
                action: row[2] as AuditAction,
                entityType: row[3] as EntityType,
                entityId: row[4] || "",
                employeeId: row[5] || "",
                employeeName: row[6] || "",
                performedBy: row[7] || "",
                performedById: row[8] || "",
                fieldChanged: row[9] || undefined,
                oldValue: row[10] || undefined,
                newValue: row[11] || undefined,
                reason: row[12] || undefined,
                ipAddress: row[13] || undefined,
                userAgent: row[14] || undefined,
            }));

        // Filter by date range if provided
        if (startDate) {
            const start = new Date(startDate);
            logs = logs.filter((log) => new Date(log.timestamp) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            logs = logs.filter((log) => new Date(log.timestamp) <= end);
        }

        return logs.reverse(); // Most recent first
    } catch (error) {
        logger.error("Error fetching employee audit logs:", error);
        throw error;
    }
}

/**
 * Get audit logs by admin (who performed the action)
 */
export async function getAdminAuditLogs(
    spreadsheetId: string,
    adminId: string,
    startDate?: string,
    endDate?: string
): Promise<AuditLog[]> {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Audit_Logs!A2:O",
        });

        const rows = response.data.values || [];

        let logs: AuditLog[] = rows
            .filter((row) => row[8] === adminId)
            .map((row) => ({
                id: row[0] || "",
                timestamp: row[1] || "",
                action: row[2] as AuditAction,
                entityType: row[3] as EntityType,
                entityId: row[4] || "",
                employeeId: row[5] || "",
                employeeName: row[6] || "",
                performedBy: row[7] || "",
                performedById: row[8] || "",
                fieldChanged: row[9] || undefined,
                oldValue: row[10] || undefined,
                newValue: row[11] || undefined,
                reason: row[12] || undefined,
                ipAddress: row[13] || undefined,
                userAgent: row[14] || undefined,
            }));

        // Filter by date range if provided
        if (startDate) {
            const start = new Date(startDate);
            logs = logs.filter((log) => new Date(log.timestamp) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            logs = logs.filter((log) => new Date(log.timestamp) <= end);
        }

        return logs.reverse(); // Most recent first
    } catch (error) {
        logger.error("Error fetching admin audit logs:", error);
        throw error;
    }
}

/**
 * Get all audit logs with optional filters
 */
export async function getAllAuditLogs(
    spreadsheetId: string,
    filters?: {
        entityType?: EntityType;
        action?: AuditAction;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }
): Promise<AuditLog[]> {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Audit_Logs!A2:O",
        });

        const rows = response.data.values || [];

        let logs: AuditLog[] = rows.map((row) => ({
            id: row[0] || "",
            timestamp: row[1] || "",
            action: row[2] as AuditAction,
            entityType: row[3] as EntityType,
            entityId: row[4] || "",
            employeeId: row[5] || "",
            employeeName: row[6] || "",
            performedBy: row[7] || "",
            performedById: row[8] || "",
            fieldChanged: row[9] || undefined,
            oldValue: row[10] || undefined,
            newValue: row[11] || undefined,
            reason: row[12] || undefined,
            ipAddress: row[13] || undefined,
            userAgent: row[14] || undefined,
        }));

        // Apply filters
        if (filters) {
            if (filters.entityType) {
                logs = logs.filter((log) => log.entityType === filters.entityType);
            }
            if (filters.action) {
                logs = logs.filter((log) => log.action === filters.action);
            }
            if (filters.startDate) {
                const start = new Date(filters.startDate);
                logs = logs.filter((log) => new Date(log.timestamp) >= start);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                logs = logs.filter((log) => new Date(log.timestamp) <= end);
            }
        }

        logs = logs.reverse(); // Most recent first

        // Apply limit
        if (filters?.limit) {
            logs = logs.slice(0, filters.limit);
        }

        return logs;
    } catch (error) {
        logger.error("Error fetching all audit logs:", error);
        throw error;
    }
}

/**
 * Helper function to log attendance modifications
 */
export async function logAttendanceChange(
    spreadsheetId: string,
    data: {
        employeeId: string;
        employeeName: string;
        date: string;
        fieldChanged: string;
        oldValue: string;
        newValue: string;
        performedBy: string;
        performedById: string;
        reason?: string;
    }
): Promise<string> {
    return createAuditLog(spreadsheetId, {
        action: AuditAction.UPDATE,
        entityType: EntityType.ATTENDANCE,
        entityId: `${data.date}_${data.employeeId}`,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        performedBy: data.performedBy,
        performedById: data.performedById,
        fieldChanged: data.fieldChanged,
        oldValue: data.oldValue,
        newValue: data.newValue,
        reason: data.reason,
    });
}

/**
 * Helper function to log leave approval/rejection
 */
export async function logLeaveAction(
    spreadsheetId: string,
    data: {
        leaveId: string;
        employeeId: string;
        employeeName: string;
        action: "APPROVE" | "REJECT";
        performedBy: string;
        performedById: string;
        reason?: string;
    }
): Promise<string> {
    return createAuditLog(spreadsheetId, {
        action: data.action === "APPROVE" ? AuditAction.APPROVE : AuditAction.REJECT,
        entityType: EntityType.LEAVE,
        entityId: data.leaveId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        performedBy: data.performedBy,
        performedById: data.performedById,
        reason: data.reason,
    });
}

/**
 * Helper function to log night duty approval/rejection
 */
export async function logNightDutyAction(
    spreadsheetId: string,
    data: {
        requestId: string;
        employeeId: string;
        employeeName: string;
        action: "APPROVE" | "REJECT";
        performedBy: string;
        performedById: string;
        reason?: string;
    }
): Promise<string> {
    return createAuditLog(spreadsheetId, {
        action: data.action === "APPROVE" ? AuditAction.APPROVE : AuditAction.REJECT,
        entityType: EntityType.NIGHT_DUTY,
        entityId: data.requestId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        performedBy: data.performedBy,
        performedById: data.performedById,
        reason: data.reason,
    });
}
