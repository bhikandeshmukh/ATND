# Google Sheets Structure Reference

This document describes the structure of all Google Sheets used in the Attendance Tracking System.

## Existing Sheets

### 1. Employees
Stores employee information and credentials.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | 3-digit employee ID | 001 |
| Name | String | Full name | John Doe |
| Position | String | Job title | Manager |
| Role | String | Admin or User | Admin |
| Status | String | Active or Inactive | Active |
| Total Working Days | Number | Expected working days per month | 26 |
| Fixed In Time | Time | Expected check-in time | 09:00 |
| Fixed Out Time | Time | Expected check-out time | 18:00 |
| Per Minute Rate | Number | Rate per minute (₹) | 0 |
| Fixed Salary | Number | Monthly salary (₹) | 50000 |
| Username | String | Login username | john.doe |
| Password | String | Hashed password | $2b$10$... |
| **Email** | **String** | **Email address (NEW)** | **john@example.com** |
| **Shift ID** | **String** | **Assigned shift (NEW)** | **SH001** |
| **Notifications Enabled** | **Boolean** | **Receive notifications (NEW)** | **TRUE** |
| **Notification Types** | **String** | **Notification preferences (NEW)** | **leave,attendance** |

### 2. Monthly Attendance (e.g., 2025-01)
Stores daily attendance records for each month.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Date | Date | Attendance date | 2025-01-15 |
| Employee Name | String | Employee name | John Doe |
| In Time | Time | Check-in time | 09:00:00 AM |
| Out Time | Time | Check-out time | 06:00:00 PM |
| In Location | String | Check-in coordinates | 21.169679, 72.850077 |
| Out Location | String | Check-out coordinates | 21.169679, 72.850077 |
| Total Minutes | Number | Total working minutes | 540 |
| Total Hours | String | Total working hours | 9:00 |
| Modified By | String | Who modified the record | Admin: John |
| **Overtime Minutes** | **Number** | **Extra minutes worked (NEW)** | **60** |
| **Overtime Pay** | **Number** | **Overtime compensation (NEW)** | **500** |
| **Is Holiday** | **Boolean** | **Holiday work flag (NEW)** | **FALSE** |

### 3. Leaves
Stores leave requests and approvals.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Leave ID | L0001 |
| Employee Name | String | Employee name | John Doe |
| Leave Type | String | Type of leave | sick |
| Start Date | Date | Leave start date | 2025-01-15 |
| End Date | Date | Leave end date | 2025-01-17 |
| Reason | String | Leave reason | Medical appointment |
| Status | String | pending/approved/rejected | approved |
| Payment Status | String | paid/unpaid | paid |
| Applied Date | Date | Application date | 2025-01-10 |
| Approved By | String | Approver name | Admin User |
| Approved Date | Date | Approval date | 2025-01-11 |
| Approved Time | Time | Approval time | 10:30:00 |

### 4. Night_Duty_Requests
Stores night duty requests and approvals.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Request ID | ND0001 |
| Employee Name | String | Employee name | John Doe |
| Date | Date | Night duty date | 2025-01-20 |
| Reason | String | Request reason | Emergency maintenance |
| Status | String | pending/approved/rejected | approved |
| Requested Date | Date | Request submission date | 2025-01-15 |
| Approved By | String | Approver name | Admin User |
| Approved Date | Date | Approval date | 2025-01-16 |
| Approved Time | Time | Approval time | 14:30:00 |

## New Sheets (Advanced Features)

### 5. Reset_Tokens
Stores password reset tokens (temporary, auto-cleaned).

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Token ID | RT0001 |
| User ID | String | Employee ID | 001 |
| Token | String | Hashed reset token | $2b$10$... |
| Expires At | DateTime | Token expiration | 2025-01-15T10:30:00Z |
| Used | Boolean | Whether token was used | FALSE |
| Created At | DateTime | Creation timestamp | 2025-01-15T09:30:00Z |
| IP Address | String | Request IP address | 192.168.1.100 |

### 6. Audit_Logs
Immutable log of all system modifications.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Log entry ID | AL0001 |
| Timestamp | DateTime | When change occurred | 2025-01-15T10:30:00Z |
| Action | String | CREATE/UPDATE/DELETE/APPROVE/REJECT | UPDATE |
| Entity Type | String | Type of entity changed | Attendance |
| Entity ID | String | ID of changed entity | 2025-01-15_001 |
| Employee ID | String | Affected employee | 001 |
| Performed By | String | Who made the change | Admin User |
| Performed By ID | String | Admin's employee ID | 002 |
| Field Changed | String | Which field was modified | Out Time |
| Old Value | String | Previous value | 05:00:00 PM |
| New Value | String | New value | 06:00:00 PM |
| Reason | String | Reason for change | Forgot to check out |
| IP Address | String | Request IP | 192.168.1.100 |
| User Agent | String | Browser info | Mozilla/5.0... |

### 7. Shifts
Defines work shift schedules.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Shift ID | SH001 |
| Name | String | Shift name | Morning Shift |
| Start Time | Time | Shift start time | 09:00 |
| End Time | Time | Shift end time | 18:00 |
| Break Duration | Number | Break time in minutes | 60 |
| Working Days | String | Comma-separated days | Mon,Tue,Wed,Thu,Fri |
| Grace Time | Number | Late arrival grace (minutes) | 15 |
| Is Active | Boolean | Whether shift is active | TRUE |
| Created At | DateTime | Creation timestamp | 2025-01-15T10:00:00Z |
| Updated At | DateTime | Last update timestamp | 2025-01-15T10:00:00Z |

### 8. Overtime
Records overtime work and approvals.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Overtime ID | OT0001 |
| Employee ID | String | Employee ID | 001 |
| Employee Name | String | Employee name | John Doe |
| Date | Date | Work date | 2025-01-15 |
| Regular Minutes | Number | Normal working minutes | 540 |
| Overtime Minutes | Number | Extra minutes worked | 120 |
| Overtime Type | String | DAILY/WEEKLY/HOLIDAY | DAILY |
| Overtime Rate | Number | Multiplier rate | 1.5 |
| Overtime Pay | Number | Calculated pay (₹) | 1000 |
| Status | String | PENDING/APPROVED/REJECTED/PAID | APPROVED |
| Approved By | String | Approver name | Admin User |
| Approved At | DateTime | Approval timestamp | 2025-01-16T10:00:00Z |
| Reason | String | Overtime reason | Project deadline |
| Created At | DateTime | Record creation | 2025-01-15T18:30:00Z |

### 9. Overtime_Rules
Configures overtime calculation rules.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Rule ID | OR001 |
| Name | String | Rule name | Default Overtime Rule |
| Daily Threshold | Number | Daily minutes threshold | 480 |
| Weekly Threshold | Number | Weekly minutes threshold | 2400 |
| Regular Rate | Number | Regular overtime multiplier | 1.5 |
| Holiday Rate | Number | Holiday overtime multiplier | 2.0 |
| Requires Approval | Boolean | Need admin approval | TRUE |
| Auto Approve Under | Number | Auto-approve threshold (min) | 60 |
| Is Active | Boolean | Whether rule is active | TRUE |

**Default Rule Created Automatically:**
- Daily Threshold: 480 minutes (8 hours)
- Weekly Threshold: 2400 minutes (40 hours)
- Regular Rate: 1.5x
- Holiday Rate: 2.0x
- Requires Approval: TRUE
- Auto Approve Under: 60 minutes

### 10. Holidays
Company holiday calendar.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| ID | String | Holiday ID | HD0001 |
| Date | Date | Holiday date | 2025-01-26 |
| Name | String | Holiday name | Republic Day |
| Type | String | PUBLIC/OPTIONAL/REGIONAL | PUBLIC |
| Description | String | Holiday description | National holiday |
| Is Recurring | Boolean | Annual holiday | TRUE |
| Recurrence Rule | String | Recurrence pattern | January 26 |
| Locations | String | Applicable locations | All |
| Is Active | Boolean | Whether holiday is active | TRUE |
| Created At | DateTime | Creation timestamp | 2025-01-01T00:00:00Z |
| Updated At | DateTime | Last update timestamp | 2025-01-01T00:00:00Z |

## Data Types Reference

- **String**: Text data
- **Number**: Numeric data (integers or decimals)
- **Boolean**: TRUE or FALSE
- **Date**: YYYY-MM-DD format
- **Time**: HH:MM or HH:MM:SS format
- **DateTime**: ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)

## Naming Conventions

### IDs
- Employees: 001, 002, 003 (3-digit)
- Leaves: L0001, L0002, L0003
- Night Duty: ND0001, ND0002, ND0003
- Reset Tokens: RT0001, RT0002, RT0003
- Audit Logs: AL0001, AL0002, AL0003
- Shifts: SH001, SH002, SH003
- Overtime: OT0001, OT0002, OT0003
- Overtime Rules: OR001, OR002, OR003
- Holidays: HD0001, HD0002, HD0003

### Sheet Names
- Monthly Attendance: YYYY-MM format (e.g., 2025-01, 2025-02)
- Other sheets: Fixed names (Employees, Leaves, etc.)

## Important Notes

1. **Audit Logs are immutable** - Never delete or modify audit log entries
2. **Reset Tokens expire** - Automatically cleaned up after 24 hours
3. **Passwords are hashed** - Never store plain text passwords
4. **Timestamps use IST** - All times are in Indian Standard Time (UTC+5:30)
5. **Boolean values** - Use TRUE/FALSE (case-insensitive)
6. **Empty values** - Leave cells empty if no data (don't use NULL or N/A)

## Validation Rules

### Employees
- ID: Must be unique, 3 digits
- Username: Must be unique
- Email: Must be valid email format
- Role: Must be "Admin" or "User"
- Status: Must be "Active" or "Inactive"

### Attendance
- Date: Must be valid date
- Times: Must be valid time format
- Total Minutes: Auto-calculated
- Overtime: Auto-calculated based on rules

### Leaves
- Start Date ≤ End Date
- Status: pending/approved/rejected
- Leave Type: sick/casual/earned/unpaid

### Shifts
- End Time > Start Time
- Grace Time: 0-60 minutes recommended
- Working Days: Valid day names

### Overtime
- Overtime Minutes ≥ 0
- Overtime Rate: 1.0-3.0 recommended
- Status: PENDING/APPROVED/REJECTED/PAID

### Holidays
- Date: Must be valid date
- Type: PUBLIC/OPTIONAL/REGIONAL
- Is Recurring: TRUE/FALSE

## Backup Recommendations

1. **Daily**: Export Audit_Logs
2. **Weekly**: Export all attendance data
3. **Monthly**: Full spreadsheet backup
4. **Before major changes**: Manual backup

## Performance Considerations

- **Audit Logs**: Archive logs older than 1 year
- **Reset Tokens**: Auto-cleanup expired tokens
- **Monthly Sheets**: One sheet per month (don't combine)
- **Indexing**: Keep ID columns sorted for faster lookups
