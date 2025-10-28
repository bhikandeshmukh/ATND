# Notification System Guide 🔔

Complete guide for the manual notification system in Attendance Tracker.

## Overview

The notification system allows:
- **Admins**: Create and send notifications to individual users or all users
- **Users**: View, read, and manage their notifications

## Features

### For Admins 👨‍💼

#### 1. Send Notifications
- Navigate to **Notifications** tab
- Choose recipient:
  - **Single User**: Select from dropdown
  - **All Users**: Check "Send to All Users"
- Select notification type
- Write title and message
- Preview before sending
- Click "Send Notification"

#### 2. Notification Types
- 🔔 **System Alert**: General announcements
- ✅ **Leave Approved**: Leave approval notifications
- ❌ **Leave Rejected**: Leave rejection notifications
- ✅ **Night Duty Approved**: Night duty approval
- ❌ **Night Duty Rejected**: Night duty rejection
- 📋 **Attendance Modified**: Attendance change alerts
- ⏰ **Late Arrival**: Late arrival warnings
- 🔑 **Password Reset**: Password reset confirmations

#### 3. Quick Messages
Pre-defined templates for common notifications:
- System Maintenance
- Holiday Announcement
- Report Submission Reminder
- Meeting Reminder

#### 4. Features
- ✅ Real-time preview
- ✅ Character limits (Title: 100, Message: 500)
- ✅ Send to all users with one click
- ✅ Statistics dashboard
- ✅ Clear form button

### For Users 👤

#### 1. View Notifications
- Navigate to **Notifications** tab
- See all your notifications in one place
- Filter by:
  - **All**: Show all notifications
  - **Unread**: Show only unread notifications

#### 2. Manage Notifications
- **Mark as Read**: Click "Mark as read" on individual notifications
- **Mark All as Read**: Click "Mark all as read" button
- **Delete**: Remove unwanted notifications
- **Refresh**: Get latest notifications

#### 3. Notification Bell 🔔
- Located in top-right corner
- Shows unread count badge
- Click to see dropdown with recent notifications
- Quick actions: Mark as read, Delete
- Auto-refreshes every 30 seconds

## API Endpoints

### Create Notification (Admin Only)
```http
POST /api/notifications/create
Content-Type: application/json

{
  "userId": "E001",           // Required if sendToAll is false
  "type": "system_alert",     // Notification type
  "title": "System Maintenance",
  "message": "System will be down from 10 PM to 11 PM",
  "sendToAll": false          // true to send to all users
}
```

### Get User Notifications
```http
GET /api/notifications?userId=E001&unreadOnly=false
```

### Mark as Read
```http
PUT /api/notifications/N00001/read
```

### Mark All as Read
```http
PUT /api/notifications/mark-all-read
Content-Type: application/json

{
  "userId": "E001"
}
```

### Delete Notification
```http
DELETE /api/notifications/N00001
```

### Get Unread Count
```http
GET /api/notifications/unread-count?userId=E001
```

## Usage Examples

### Example 1: Send System Alert to All Users

```typescript
const response = await fetch("/api/notifications/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "system_alert",
    title: "System Maintenance",
    message: "The system will be under maintenance from 10 PM to 11 PM today.",
    sendToAll: true
  })
});
```

### Example 2: Send Leave Approval to Single User

```typescript
const response = await fetch("/api/notifications/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "E001",
    type: "leave_approved",
    title: "Leave Request Approved",
    message: "Your leave request for 2025-02-15 has been approved.",
    sendToAll: false
  })
});
```

### Example 3: Get User Notifications

```typescript
import { notificationService } from "@/lib/notifications/client";

// Get all notifications
const notifications = await notificationService.getNotifications("E001");

// Get only unread
const unread = await notificationService.getNotifications("E001", true);

// Mark as read
await notificationService.markAsRead("N00001");

// Delete notification
await notificationService.deleteNotification("N00001");
```

## Best Practices

### For Admins

1. **Be Clear and Concise**
   - Use descriptive titles
   - Keep messages short and actionable
   - Avoid jargon

2. **Choose Appropriate Type**
   - Use correct notification type for better organization
   - Users can filter by type

3. **Test Before Broadcasting**
   - Send to yourself first
   - Verify message content
   - Then send to all users

4. **Avoid Notification Fatigue**
   - Don't send too many notifications
   - Combine related information
   - Use appropriate urgency levels

5. **Use Quick Messages**
   - Save time with templates
   - Customize as needed
   - Create your own templates

### For Users

1. **Check Regularly**
   - Look for notification bell badge
   - Check notifications tab daily
   - Enable browser notifications (future feature)

2. **Keep Inbox Clean**
   - Mark notifications as read
   - Delete old notifications
   - Use filters to find important ones

3. **Take Action**
   - Read notifications promptly
   - Follow instructions
   - Contact admin if unclear

## Notification Flow

```
Admin Creates Notification
         ↓
Saved to Google Sheets (Notifications sheet)
         ↓
User Opens App
         ↓
Notification Bell Shows Unread Count
         ↓
User Clicks Bell or Opens Notifications Tab
         ↓
Notifications Displayed
         ↓
User Marks as Read or Deletes
         ↓
Status Updated in Google Sheets
```

## Data Structure

### Notifications Sheet Columns
- **ID**: Unique notification ID (N00001, N00002, etc.)
- **User ID**: Employee ID (E001, E002, etc.)
- **Type**: Notification type (system_alert, leave_approved, etc.)
- **Title**: Notification title (max 100 chars)
- **Message**: Notification message (max 500 chars)
- **Data**: Additional metadata (JSON)
- **Is Read**: Read status (TRUE/FALSE)
- **Created At**: Timestamp when created
- **Read At**: Timestamp when marked as read

## Troubleshooting

### Notifications Not Showing

1. **Check User ID**
   - Ensure correct user ID is used
   - Verify user exists in Employees sheet

2. **Refresh Page**
   - Click refresh button
   - Reload browser page

3. **Check Filters**
   - Switch between "All" and "Unread"
   - Clear any active filters

### Cannot Send Notification

1. **Check Permissions**
   - Only admins can send notifications
   - Verify admin role

2. **Validate Input**
   - Title and message are required
   - Check character limits
   - Select user or "Send to All"

3. **Check API Response**
   - Open browser console
   - Look for error messages
   - Contact support if needed

### Notification Bell Not Updating

1. **Wait for Auto-Refresh**
   - Bell refreshes every 30 seconds
   - Or manually refresh page

2. **Check Browser Console**
   - Look for API errors
   - Verify network connectivity

## Future Enhancements

- [ ] Email notifications
- [ ] Push notifications
- [ ] Notification scheduling
- [ ] Rich text formatting
- [ ] Attachments support
- [ ] Notification templates management
- [ ] Read receipts
- [ ] Notification analytics
- [ ] Custom notification sounds
- [ ] Notification categories

## Support

For issues or questions:
1. Check this documentation
2. Contact system administrator
3. Report bugs to development team

---

© 2025-26 Bhikan Deshmukh. All rights reserved.
