# Advanced Features Setup Guide

This guide will help you set up the new advanced features for the Attendance Tracking System.

## Prerequisites

- Node.js 18+ installed
- Google Cloud Project with Sheets API enabled
- Service account credentials
- Google Spreadsheet created

## Step 1: Install Dependencies

```bash
npm install
```

This will install the new `tsx` dependency needed for running TypeScript scripts.

## Step 2: Initialize Google Sheets

Run the initialization script to create all required sheets:

```bash
npm run init-sheets
```

This script will create the following sheets in your Google Spreadsheet:

### New Sheets Created:

1. **Reset_Tokens** - Stores password reset tokens
   - Columns: ID, User ID, Token, Expires At, Used, Created At, IP Address

2. **Audit_Logs** - Tracks all system modifications
   - Columns: ID, Timestamp, Action, Entity Type, Entity ID, Employee ID, Performed By, Performed By ID, Field Changed, Old Value, New Value, Reason, IP Address, User Agent

3. **Shifts** - Defines work shifts
   - Columns: ID, Name, Start Time, End Time, Break Duration, Working Days, Grace Time, Is Active, Created At, Updated At

4. **Overtime** - Records overtime work
   - Columns: ID, Employee ID, Employee Name, Date, Regular Minutes, Overtime Minutes, Overtime Type, Overtime Rate, Overtime Pay, Status, Approved By, Approved At, Reason, Created At

5. **Overtime_Rules** - Configures overtime calculation
   - Columns: ID, Name, Daily Threshold, Weekly Threshold, Regular Rate, Holiday Rate, Requires Approval, Auto Approve Under, Is Active
   - **Note**: A default rule is automatically created

6. **Holidays** - Company holiday calendar
   - Columns: ID, Date, Name, Type, Description, Is Recurring, Recurrence Rule, Locations, Is Active, Created At, Updated At

### Updated Sheets:

1. **Employees** - New columns added:
   - Email (for notifications and password reset)
   - Shift ID (for shift assignment)
   - Notifications Enabled (boolean)
   - Notification Types (comma-separated list)

2. **Monthly Attendance Sheets** (e.g., 2025-01) - New columns added:
   - Overtime Minutes
   - Overtime Pay
   - Is Holiday (boolean)

## Step 3: Update Employee Records

After initialization, update your existing employee records to include email addresses:

1. Open your Google Spreadsheet
2. Go to the "Employees" sheet
3. Add email addresses for all employees in the "Email" column
4. Set "Notifications Enabled" to TRUE for employees who want notifications
5. Leave "Notification Types" empty to receive all notifications

Example employee row:
```
001 | John Doe | Manager | Admin | Active | 26 | 09:00 | 18:00 | 0 | 50000 | john.doe | [hashed] | john@example.com | | TRUE | 
```

## Step 4: Configure Email Service (Optional)

To enable email notifications, add these environment variables to your `.env.local`:

```env
# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourcompany.com
FROM_NAME=Attendance System
```

### Gmail Setup:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

### Other Email Providers:
- **SendGrid**: Use API key authentication
- **AWS SES**: Configure AWS credentials
- **Mailgun**: Use SMTP credentials

## Step 5: Verify Installation

1. Start the development server:
```bash
npm run dev
```

2. Check the API endpoint to verify sheets exist:
```bash
curl http://localhost:3000/api/admin/init-sheets
```

Expected response:
```json
{
  "spreadsheetId": "your-spreadsheet-id",
  "allExist": true,
  "missing": []
}
```

## Step 6: Test Features

### Test Password Reset:
1. Go to login page
2. Click "Forgot Password?"
3. Enter username
4. Check email for reset link (if email configured)

### Test Shift Management:
1. Login as admin
2. Go to Shifts tab (to be implemented)
3. Create a new shift
4. Assign employees to shift

### Test Overtime Calculation:
1. Check in and out with overtime hours
2. View overtime records in admin panel
3. Approve/reject overtime

### Test Holiday Management:
1. Go to Holidays tab (to be implemented)
2. Add company holidays
3. Check attendance on holiday dates

### Test Audit Logging:
1. Modify any attendance record as admin
2. View audit log to see the change history
3. Export audit logs

## Troubleshooting

### Error: "GOOGLE_SPREADSHEET_ID not configured"
- Make sure `.env.local` has the correct spreadsheet ID
- Restart the development server after changing environment variables

### Error: "Permission denied"
- Verify service account has edit access to the spreadsheet
- Check that the service account email is added as an editor

### Sheets not created:
- Check Google Sheets API is enabled in your Google Cloud Project
- Verify service account credentials are correct
- Check console logs for detailed error messages

### Email not sending:
- Verify SMTP credentials are correct
- Check firewall/network settings
- Test SMTP connection separately
- Check email service logs

## Next Steps

After successful setup:

1. **Configure Overtime Rules**: Adjust thresholds and rates in Overtime_Rules sheet
2. **Add Holidays**: Import or manually add company holidays
3. **Create Shifts**: Define work shifts for your organization
4. **Train Users**: Inform employees about new features
5. **Monitor Audit Logs**: Review system changes regularly

## API Endpoints

### Initialize Sheets (Admin Only)
```
POST /api/admin/init-sheets
```

### Check Sheets Status
```
GET /api/admin/init-sheets
```

## Support

For issues or questions:
1. Check the main README.md
2. Review the spec files in `.kiro/specs/advanced-features/`
3. Check console logs for error details
4. Verify Google Sheets structure matches expected format

## Security Notes

- **Password Reset Tokens**: Expire after 1 hour
- **Audit Logs**: Cannot be modified or deleted
- **Email Notifications**: Contain no sensitive data
- **Overtime Approval**: Requires admin authorization
- **Shift Management**: Admin-only feature

## Performance Tips

- **Large Datasets**: Use pagination for reports
- **Email Sending**: Batch notifications when possible
- **Audit Logs**: Archive old logs periodically
- **Caching**: Shift and holiday data is cached

## Maintenance

### Daily:
- Clean up expired reset tokens (automatic)

### Weekly:
- Review audit logs for anomalies
- Check email delivery success rate

### Monthly:
- Archive old audit logs
- Review overtime calculations
- Update holiday calendar

### Quarterly:
- Review and optimize overtime rules
- Audit security settings
- Update employee shift assignments
