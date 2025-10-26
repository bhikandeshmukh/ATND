import { google } from "googleapis";
import { Employee } from "./types";
import { hashPassword, verifyPassword } from "./security";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const EMPLOYEE_SHEET_NAME = "Employees";

export async function ensureEmployeeSheet(spreadsheetId: string) {
  const expectedHeaders = ["ID", "Name", "Position", "Role", "Status", "Total Working Days", "Fixed In Time", "Fixed Out Time", "Per Minute Rate", "Fixed Salary", "Username", "Password"];

  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheet = response.data.sheets?.find(
      (sheet) => sheet.properties?.title === EMPLOYEE_SHEET_NAME
    );

    if (existingSheet) {
      // Check and update headers if needed
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${EMPLOYEE_SHEET_NAME}!A1:L1`,
      });

      const currentHeaders = headerResponse.data.values?.[0] || [];
      const needsUpdate =
        currentHeaders.length !== expectedHeaders.length ||
        !expectedHeaders.every((header, index) => currentHeaders[index] === header);

      if (needsUpdate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${EMPLOYEE_SHEET_NAME}!A1:L1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [expectedHeaders],
          },
        });
      }
    } else {
      // Create new sheet with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: EMPLOYEE_SHEET_NAME },
              },
            },
          ],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${EMPLOYEE_SHEET_NAME}!A1:L1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [expectedHeaders],
        },
      });
    }
  } catch (error) {
    console.error("Error ensuring employee sheet:", error);
    throw error;
  }
}

export async function addEmployee(spreadsheetId: string, employee: Omit<Employee, "id">) {
  await ensureEmployeeSheet(spreadsheetId);

  // Get next 3-digit employee ID
  const employees = await getEmployees(spreadsheetId);
  let nextId = 1;

  if (employees.length > 0) {
    const existingIds = employees
      .map(emp => parseInt(emp.id))
      .filter(id => !isNaN(id));

    if (existingIds.length > 0) {
      nextId = Math.max(...existingIds) + 1;
    }
  }

  // Ensure 3-digit format (001, 002, etc.)
  const id = String(nextId).padStart(3, '0');

  // Hash password if provided
  let hashedPassword = "";
  if (employee.password) {
    hashedPassword = await hashPassword(employee.password);
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${EMPLOYEE_SHEET_NAME}!A:L`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        id,
        employee.name,
        employee.position || "",
        employee.role === "admin" ? "Admin" : "User",
        employee.status === "inactive" ? "Inactive" : "Active",
        employee.totalWorkingDays,
        employee.fixedInTime,
        employee.fixedOutTime,
        employee.perMinuteRate,
        employee.fixedSalary,
        employee.username || "",
        hashedPassword,
      ]],
    },
  });

  return id;
}

export async function getEmployees(spreadsheetId: string): Promise<Employee[]> {
  await ensureEmployeeSheet(spreadsheetId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${EMPLOYEE_SHEET_NAME}!A2:L`,
  });

  const rows = response.data.values || [];

  return rows.map((row: any[]) => {
    const statusValue = row[4]?.toString().trim().toLowerCase();
    const roleValue = row[3]?.toString().trim().toLowerCase();

    return {
      id: row[0] || "",
      name: row[1] || "",
      position: row[2] || "",
      role: (roleValue === "admin" ? "admin" : "user") as "admin" | "user",
      status: (statusValue === "inactive" ? "inactive" : "active") as "active" | "inactive",
      totalWorkingDays: parseInt(row[5]) || 0,
      fixedInTime: row[6] || "",
      fixedOutTime: row[7] || "",
      perMinuteRate: parseFloat(row[8]) || 0,
      fixedSalary: parseFloat(row[9]) || 0,
      username: row[10] || "",
      password: row[11] || "",
    };
  });
}

export async function authenticateEmployee(spreadsheetId: string, username: string, password: string) {
  const employees = await getEmployees(spreadsheetId);

  const employee = employees.find((emp) => emp.username === username);

  if (!employee) {
    return null;
  }

  // Check if employee is active
  if (employee.status !== "active") {
    return null; // Inactive employees cannot login
  }

  // Check if password exists
  if (!employee.password) {
    return null;
  }

  // Verify password (supports both hashed and plain text for migration)
  let isValidPassword = false;
  
  if (employee.password.startsWith("$2a$") || employee.password.startsWith("$2b$")) {
    // Hashed password
    isValidPassword = await verifyPassword(password, employee.password);
  } else {
    // Plain text password (for backward compatibility during migration)
    isValidPassword = password === employee.password;
    
    // Auto-migrate to hashed password
    if (isValidPassword && process.env.GOOGLE_SPREADSHEET_ID) {
      const hashedPassword = await hashPassword(password);
      await updateEmployeePassword(process.env.GOOGLE_SPREADSHEET_ID, employee.id, hashedPassword);
    }
  }

  if (!isValidPassword) {
    return null;
  }

  return {
    id: employee.id,
    name: employee.name,
    username: employee.username || employee.name,
    role: employee.role,
  };
}

async function updateEmployeePassword(spreadsheetId: string, employeeId: string, hashedPassword: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${EMPLOYEE_SHEET_NAME}!A:A`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === employeeId);

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${EMPLOYEE_SHEET_NAME}!L${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[hashedPassword]],
        },
      });
    }
  } catch (error) {
    console.error("Error updating employee password:", error);
  }
}

export async function deleteEmployee(spreadsheetId: string, employeeId: string) {
  await ensureEmployeeSheet(spreadsheetId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${EMPLOYEE_SHEET_NAME}!A:A`,
  });

  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === employeeId);

  if (rowIndex !== -1) {
    const sheetId = await getSheetId(spreadsheetId, EMPLOYEE_SHEET_NAME);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });
  }
}

async function getSheetId(spreadsheetId: string, sheetName: string): Promise<number> {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = response.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  return sheet?.properties?.sheetId || 0;
}
