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

export async function getOrCreateMonthlySheet(spreadsheetId: string) {
  const now = new Date();
  const sheetName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const expectedHeaders = ["Date", "Employee Name", "In Time", "Out Time", "In Location", "Out Location", "Total Minutes", "Total Hours", "Modified By", "Overtime Minutes", "Overtime Pay", "Is Holiday"];

  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheet = response.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetName
    );

    const lastColumn = getColumnLetter(expectedHeaders.length);

    if (existingSheet) {
      // Check and update headers if needed
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:${lastColumn}1`,
      });

      const currentHeaders = headerResponse.data.values?.[0] || [];
      const needsUpdate =
        currentHeaders.length !== expectedHeaders.length ||
        !expectedHeaders.every((header, index) => currentHeaders[index] === header);

      if (needsUpdate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:${lastColumn}1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [expectedHeaders],
          },
        });
      }

      return sheetName;
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
      range: `${sheetName}!A1:${lastColumn}1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [expectedHeaders],
      },
    });

    return sheetName;
  } catch (error) {
    console.error("Error creating monthly sheet:", error);
    throw error;
  }
}

export async function addAttendanceRecord(
  spreadsheetId: string,
  record: {
    date: string;
    employeeName: string;
    inTime: string;
    outTime: string;
    inLocation: string;
    outLocation: string;
  }
) {
  const sheetName = await getOrCreateMonthlySheet(spreadsheetId);

  const inDate = new Date(`${record.date} ${record.inTime}`);
  const outDate = new Date(`${record.date} ${record.outTime}`);
  const totalMinutes = Math.floor((outDate.getTime() - inDate.getTime()) / 60000);
  const totalHours = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, "0")}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:H`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[record.date, record.employeeName, record.inTime, record.outTime, record.inLocation, record.outLocation, totalMinutes, totalHours]],
    },
  });
}

export async function getMonthlyAttendance(spreadsheetId: string) {
  const sheetName = await getOrCreateMonthlySheet(spreadsheetId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:H`,
  });

  return response.data.values || [];
}


export async function addCheckInRecord(
  spreadsheetId: string,
  record: {
    date: string;
    employeeName: string;
    inTime: string;
    inLocation: string;
    modifiedBy?: string;
  }
) {
  const sheetName = await getOrCreateMonthlySheet(spreadsheetId);

  // Check if record already exists
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:J`,
  });

  const rows = response.data.values || [];
  let rowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === record.date && rows[i][1] === record.employeeName) {
      rowIndex = i + 1; // +1 because sheets are 1-indexed
      break;
    }
  }

  const modifiedBy = record.modifiedBy || "";

  if (rowIndex !== -1) {
    // Update existing record with Modified By
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:I${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[record.date, record.employeeName, record.inTime, "", record.inLocation, "", "", "", modifiedBy]],
      },
    });
  } else {
    // Add new record with Modified By
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:J`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[record.date, record.employeeName, record.inTime, "", record.inLocation, "", "", "", modifiedBy]],
      },
    });
  }
}

export async function updateAttendanceCheckOut(
  spreadsheetId: string,
  record: {
    employeeName: string;
    date: string;
    outTime: string;
    outLocation: string;
    modifiedBy?: string;
  }
) {
  const sheetName = await getOrCreateMonthlySheet(spreadsheetId);

  // Find the row with matching employee name and date
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:J`,
  });

  const rows = response.data.values || [];
  let rowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === record.date && rows[i][1] === record.employeeName) {
      rowIndex = i + 1; // +1 because sheets are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error("Check-in record not found");
  }

  // Get the in time to calculate total time
  const inTime = rows[rowIndex - 1][2];
  const inDate = new Date(`${record.date} ${inTime}`);
  const outDate = new Date(`${record.date} ${record.outTime}`);
  const totalMinutes = Math.floor((outDate.getTime() - inDate.getTime()) / 60000);
  const totalHours = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, "0")}`;

  // Update columns: D (Out Time), F (Out Location), G (Total Minutes), H (Total Hours)
  // We need to update D, F, G, H separately to avoid overwriting E (In Location)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!D${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[record.outTime]],
    },
  });

  const modifiedBy = record.modifiedBy || "";

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!F${rowIndex}:I${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[record.outLocation, totalMinutes, totalHours, modifiedBy]],
    },
  });
}


export async function checkTodayAttendanceStatus(
  spreadsheetId: string,
  employeeName: string,
  date: string
) {
  const sheetName = await getOrCreateMonthlySheet(spreadsheetId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:H`,
  });

  const rows = response.data.values || [];

  // Find today's entry for this employee
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === date && rows[i][1] === employeeName) {
      const inTime = rows[i][2] || "";
      const outTime = rows[i][3] || "";
      const inLocation = rows[i][4] || "";
      const outLocation = rows[i][5] || "";

      return {
        hasCheckedIn: !!inTime,
        hasCheckedOut: !!outTime,
        inTime,
        outTime,
        inLocation,
        outLocation,
      };
    }
  }

  return {
    hasCheckedIn: false,
    hasCheckedOut: false,
    inTime: "",
    outTime: "",
    inLocation: "",
    outLocation: "",
  };
}


export async function getSpecificMonthAttendance(spreadsheetId: string, year: string, month: string) {
  const sheetName = `${year}-${String(month).padStart(2, "0")}`;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:H`,
    });

    const rows = response.data.values || [];

    return rows.map((row: any[]) => ({
      date: row[0] || "",
      employeeName: row[1] || "",
      inTime: row[2] || "",
      outTime: row[3] || "",
      inLocation: row[4] || "",
      outLocation: row[5] || "",
      totalMinutes: parseInt(row[6]) || 0,
      totalHours: row[7] || "",
    }));
  } catch (error) {
    console.error(`Sheet ${sheetName} not found or error:`, error);
    return [];
  }
}

// Leave Management Functions

async function getOrCreateLeaveSheet(spreadsheetId: string) {
  const sheetName = "Leaves";
  const expectedHeaders = ["ID", "Employee Name", "Leave Type", "Start Date", "End Date", "Reason", "Status", "Payment Status", "Applied Date", "Approved By", "Approved Date", "Approved Time"];

  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheet = response.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetName
    );

    const lastColumn = getColumnLetter(expectedHeaders.length);

    if (existingSheet) {
      // Check and update headers if needed
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:${lastColumn}1`,
      });

      const currentHeaders = headerResponse.data.values?.[0] || [];
      const needsUpdate =
        currentHeaders.length !== expectedHeaders.length ||
        !expectedHeaders.every((header, index) => currentHeaders[index] === header);

      if (needsUpdate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:${lastColumn}1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [expectedHeaders],
          },
        });
      }

      return sheetName;
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
      range: `${sheetName}!A1:${lastColumn}1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [expectedHeaders],
      },
    });

    return sheetName;
  } catch (error) {
    console.error("Error creating leave sheet:", error);
    throw error;
  }
}

export async function addLeaveRecord(
  spreadsheetId: string,
  record: {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    appliedDate: string;
  }
) {
  const sheetName = await getOrCreateLeaveSheet(spreadsheetId);

  // Get current row count to generate ID
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = response.data.values || [];
  const newId = `L${String(rows.length).padStart(4, "0")}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:J`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        newId,
        record.employeeName,
        record.leaveType,
        record.startDate,
        record.endDate,
        record.reason,
        record.status,
        "", // Payment Status - empty initially
        record.appliedDate,
        "", // Approved By - empty initially
      ]],
    },
  });
}

export async function getAllLeaves(spreadsheetId: string) {
  const sheetName = await getOrCreateLeaveSheet(spreadsheetId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:Z`,
  });

  const rows = response.data.values || [];

  return rows.map((row: any[]) => ({
    id: row[0] || "",
    employeeName: row[1] || "",
    leaveType: row[2] || "",
    startDate: row[3] || "",
    endDate: row[4] || "",
    reason: row[5] || "",
    status: row[6] || "pending",
    paymentStatus: row[7] || "",
    appliedDate: row[8] || "",
    approvedBy: row[9] || "",
    approvedDate: row[10] || "",
    approvedTime: row[11] || "",
  }));
}

export async function updateLeaveStatus(
  spreadsheetId: string,
  id: string,
  status: string,
  paymentStatus?: string,
  approvedBy?: string
) {
  try {
    const sheetName = await getOrCreateLeaveSheet(spreadsheetId);

    console.log("Updating leave status for ID:", id);

    // Find the row with matching ID (dynamic range)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === id) {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      console.error("Leave record not found. Available IDs:", rows.map(r => r[0]));
      throw new Error(`Leave record not found with ID: ${id}`);
    }

    console.log("Found leave at row:", rowIndex);

    // Column indices (0-based): Status=6(G), PaymentStatus=7(H), ApprovedBy=9(J), ApprovedDate=10(K), ApprovedTime=11(L)
    const statusCol = getColumnLetter(7); // G
    const paymentCol = getColumnLetter(8); // H
    const approvedByCol = getColumnLetter(10); // J
    const approvedDateCol = getColumnLetter(11); // K
    const approvedTimeCol = getColumnLetter(12); // L

    // Update status column
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${statusCol}${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[status]],
      },
    });

    console.log("Status updated successfully");

    // Update payment status column if provided
    if (paymentStatus) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${paymentCol}${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[paymentStatus]],
        },
      });
      console.log("Payment status updated successfully");
    }

    // Update approved by, date, and time columns if provided
    if (approvedBy) {
      // Get current IST date and time
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istDate = new Date(now.getTime() + istOffset);
      const approvedDate = istDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const approvedTime = istDate.toTimeString().split(' ')[0]; // HH:MM:SS

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${approvedByCol}${rowIndex}:${approvedTimeCol}${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[approvedBy, approvedDate, approvedTime]],
        },
      });
      console.log("Approved by, date, and time updated successfully");
    }
  } catch (error) {
    console.error("Error in updateLeaveStatus:", error);
    throw error;
  }
}


// Night Duty Management Functions

async function getOrCreateNightDutySheet(spreadsheetId: string) {
  const sheetName = "Night_Duty_Requests";
  const expectedHeaders = ["ID", "Employee Name", "Date", "Reason", "Status", "Requested Date", "Approved By", "Approved Date", "Approved Time"];

  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheet = response.data.sheets?.find(
      (sheet) => sheet.properties?.title === sheetName
    );

    const lastColumn = getColumnLetter(expectedHeaders.length);

    if (existingSheet) {
      // Check and update headers if needed
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:${lastColumn}1`,
      });

      const currentHeaders = headerResponse.data.values?.[0] || [];
      const needsUpdate =
        currentHeaders.length !== expectedHeaders.length ||
        !expectedHeaders.every((header, index) => currentHeaders[index] === header);

      if (needsUpdate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:${lastColumn}1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [expectedHeaders],
          },
        });
      }

      return sheetName;
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
      range: `${sheetName}!A1:${lastColumn}1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [expectedHeaders],
      },
    });

    return sheetName;
  } catch (error) {
    console.error("Error creating night duty sheet:", error);
    throw error;
  }
}

export async function addNightDutyRequest(
  spreadsheetId: string,
  record: {
    employeeName: string;
    date: string;
    reason: string;
    status: string;
    requestedDate: string;
  }
) {
  const sheetName = await getOrCreateNightDutySheet(spreadsheetId);

  // Check for duplicate request
  const allResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:G`,
  });

  const allRows = allResponse.data.values || [];
  
  // Check if request already exists for this employee and date
  for (let i = 1; i < allRows.length; i++) {
    if (allRows[i][1] === record.employeeName && allRows[i][2] === record.date) {
      throw new Error("Night duty request already exists for this date");
    }
  }

  // Get current row count to generate ID
  const newId = `ND${String(allRows.length).padStart(4, "0")}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        newId,
        record.employeeName,
        record.date,
        record.reason,
        record.status,
        record.requestedDate,
        "", // Approved By - empty initially
      ]],
    },
  });
}

export async function getAllNightDutyRequests(spreadsheetId: string) {
  const sheetName = await getOrCreateNightDutySheet(spreadsheetId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:Z`,
  });

  const rows = response.data.values || [];

  return rows.map((row: any[]) => ({
    id: row[0] || "",
    employeeName: row[1] || "",
    date: row[2] || "",
    reason: row[3] || "",
    status: row[4] || "pending",
    requestedDate: row[5] || "",
    approvedBy: row[6] || "",
    approvedDate: row[7] || "",
    approvedTime: row[8] || "",
  }));
}

export async function updateNightDutyStatus(
  spreadsheetId: string,
  id: string,
  status: string,
  approvedBy?: string
) {
  try {
    const sheetName = await getOrCreateNightDutySheet(spreadsheetId);

    // Find the row with matching ID (dynamic range)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    let employeeName = "";
    let date = "";

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === id) {
        rowIndex = i + 1;
        employeeName = rows[i][1];
        date = rows[i][2];
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Night duty request not found with ID: ${id}`);
    }

    // Column indices (0-based): Status=4(E), ApprovedBy=6(G), ApprovedDate=7(H), ApprovedTime=8(I)
    const statusCol = getColumnLetter(5); // E
    const approvedByCol = getColumnLetter(7); // G
    const approvedDateCol = getColumnLetter(8); // H
    const approvedTimeCol = getColumnLetter(9); // I

    // Update status column
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${statusCol}${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[status]],
      },
    });

    // Update approved by, date, and time columns if provided
    if (approvedBy) {
      // Get current IST date and time
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istDate = new Date(now.getTime() + istOffset);
      const approvedDate = istDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const approvedTime = istDate.toTimeString().split(' ')[0]; // HH:MM:SS

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${approvedByCol}${rowIndex}:${approvedTimeCol}${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[approvedBy, approvedDate, approvedTime]],
        },
      });
    }

    // If approved, add night duty attendance to monthly sheet
    if (status === "approved") {
      const monthlySheetName = await getOrCreateMonthlySheet(spreadsheetId);
      
      // Add night duty entry: 9:00 PM to 7:00 AM
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${monthlySheetName}!A:I`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            date,
            employeeName,
            "09:00:00 PM", // Night duty start
            "07:00:00 AM", // Night duty end
            "Night Duty",
            "Night Duty",
            600, // 10 hours = 600 minutes
            "10:00",
            approvedBy || "", // Modified By (who approved)
          ]],
        },
      });
    }
  } catch (error) {
    console.error("Error in updateNightDutyStatus:", error);
    throw error;
  }
}
