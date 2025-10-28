# Attendance Tracker

Employee attendance management system with Google Sheets integration.

## Features

### Core Features
- Role-based access (Admin/User)
- Geolocation verification (20m radius)
- Check-in/Check-out tracking
- Leave management
- Night duty requests
- Monthly reports

### Advanced Features (New!)
- **In-App Notifications** - Real-time notifications for leaves, attendance, and system events
- **Audit Logging** - Complete history tracking for all attendance modifications
- **Bulk Operations** - Import/export employees, attendance, and leave data (CSV/Excel)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Generate JWT secret:
```bash
node scripts/generate-jwt-secret.js
```

3. Configure `.env.local`:
```env
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
JWT_SECRET=your-generated-secret
```

4. Initialize Google Sheets (creates all required sheets):
```bash
npm run init-sheets
```

This will create the following sheets:
- Employees
- Audit_Logs (for tracking changes)
- Notifications (for in-app notifications)
- Leaves (for leave management)
- Night_Duty_Requests (for night duty)
- Monthly attendance sheets (created automatically)

5. Add first admin to Google Sheets "Employees" tab:
```
ID: 001
Name: Admin User
Position: Administrator
Role: Admin
Status: Active
Total Working Days: 26
Fixed In Time: 09:00
Fixed Out Time: 18:00
Per Minute Rate: 0
Fixed Salary: 0
Username: admin
Password: admin123
Email: admin@example.com
Shift ID: (leave empty)
Notifications Enabled: TRUE
Notification Types: (leave empty for all)
```

6. Run:
```bash
npm run dev
```

7. Login at http://localhost:3000 with `admin` / `admin123`

8. Change password immediately through Employees tab

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Google Sheets API
- JWT + bcrypt

## License

MIT
