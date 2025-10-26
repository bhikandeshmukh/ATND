# Attendance Tracker

Employee attendance management system with Google Sheets integration.

## Features

- Role-based access (Admin/User)
- Geolocation verification (20m radius)
- Check-in/Check-out tracking
- Leave management
- Night duty requests
- Monthly reports

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

4. Add first admin to Google Sheets "Employees" tab:
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
```

5. Run:
```bash
npm run dev
```

6. Login at http://localhost:3000 with `admin` / `admin123`

7. Change password immediately through Employees tab

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Google Sheets API
- JWT + bcrypt

## License

MIT
