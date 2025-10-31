# 📍 Background Location Tracking Feature

## Overview

This feature enables real-time background location tracking with geofencing alerts. When an employee moves more than 50 meters away from the office location, both the employee and all admins receive instant notifications.

## Features

### ✅ Core Functionality
- **Background Tracking**: Monitors location even when app is minimized
- **Geofencing**: 50-meter radius from office location
- **Real-time Alerts**: Instant notifications when geofence is breached
- **Dual Notifications**: Alerts sent to both user and all admins
- **Battery Optimized**: Uses efficient GPS tracking
- **Permission Management**: Handles location and notification permissions

### 🔔 Notification System
- **Browser Notifications**: Native device notifications
- **In-App Notifications**: Stored in Firebase for history
- **Cooldown Period**: 5-minute cooldown to prevent spam
- **Rich Notifications**: Includes distance, time, and location data

### 📊 Tracking Data
- Latitude & Longitude
- Distance from office
- Accuracy (in meters)
- Timestamp
- User information

## Setup Instructions

### 1. Configure Office Location

Update the office coordinates in `components/LocationTracker.tsx`:

```typescript
const officeConfig = {
  latitude: 21.1702,  // Your office latitude
  longitude: 72.8311, // Your office longitude
  radius: 50,         // Geofence radius in meters
  officeId: 'main-office',
  officeName: 'Main Office',
};
```

### 2. Get Your Office Coordinates

**Option 1: Google Maps**
1. Open Google Maps
2. Right-click on your office location
3. Click on the coordinates to copy them

**Option 2: GPS Coordinates Website**
1. Visit https://www.gps-coordinates.net/
2. Enter your office address
3. Copy the latitude and longitude

### 3. Enable Permissions

Users need to grant two permissions:
1. **Location Permission**: For GPS tracking
2. **Notification Permission**: For alerts

The app will automatically request these when tracking is enabled.

## How to Use

### For Employees

1. **Go to Attendance Tab**
2. **Click "Start Tracking"** button
3. **Grant Permissions** when prompted
4. **Keep App Running** (can be in background)
5. **Receive Alerts** if you leave office area

### For Admins

1. **Enable Tracking** (same as employees)
2. **Receive Alerts** when any employee leaves office
3. **View Notifications** in notification bell
4. **Check Notification History** in Notifications tab

## Technical Details

### Architecture

```
┌─────────────────────────────────────────┐
│  LocationTracker Component              │
│  - UI for enable/disable tracking       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Background Tracker Service             │
│  - Geolocation API                      │
│  - Distance calculation                 │
│  - Geofence monitoring                  │
└──────────────┬──────────────────────────┘
               │
               ├──────────────┬─────────────┐
               ▼              ▼             ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│ Browser          │  │ API Routes   │  │ Firebase     │
│ Notifications    │  │ /tracking/*  │  │ Notifications│
└──────────────────┘  └──────────────┘  └──────────────┘
```

### API Endpoints

#### POST /api/tracking/location
Receives periodic location updates

**Request:**
```json
{
  "userId": "001",
  "latitude": 21.1702,
  "longitude": 72.8311,
  "accuracy": 10,
  "distance": 25.5,
  "timestamp": 1704067200000
}
```

#### POST /api/tracking/geofence-alert
Handles geofence breach alerts

**Request:**
```json
{
  "userId": "001",
  "userName": "John Doe",
  "distance": 75.5,
  "latitude": 21.1702,
  "longitude": 72.8311,
  "timestamp": 1704067200000
}
```

### Distance Calculation

Uses **Haversine Formula** for accurate distance calculation:

```typescript
const R = 6371e3; // Earth radius in meters
const φ1 = (lat1 * Math.PI) / 180;
const φ2 = (lat2 * Math.PI) / 180;
const Δφ = ((lat2 - lat1) * Math.PI) / 180;
const Δλ = ((lon2 - lon1) * Math.PI) / 180;

const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = R * c; // Distance in meters
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Geolocation API | ✅ | ✅ | ✅ | ✅ |
| Background Tracking | ✅ | ✅ | ⚠️ Limited | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| PWA Support | ✅ | ✅ | ✅ | ✅ |

**Note**: Safari on iOS has limitations with background tracking when app is not active.

## Privacy & Security

### Data Collection
- Location data is only collected when tracking is enabled
- Data is sent to server for monitoring purposes
- No location history is stored permanently (optional)

### User Control
- Users can enable/disable tracking anytime
- Clear indication when tracking is active
- Transparent about what data is collected

### Permissions
- Explicit permission requests
- Can be revoked anytime from browser settings
- No tracking without user consent

## Troubleshooting

### Location Not Updating
1. Check if location permission is granted
2. Ensure GPS is enabled on device
3. Check if app has background permission (mobile)
4. Try restarting tracking

### Notifications Not Showing
1. Check notification permission
2. Ensure notifications are not blocked in browser
3. Check device notification settings
4. Try granting permission again

### High Battery Usage
1. Location tracking uses GPS which consumes battery
2. Consider using "Battery Saver" mode
3. Disable tracking when not needed
4. Use WiFi instead of mobile data when possible

### Inaccurate Distance
1. GPS accuracy depends on device and environment
2. Indoor locations may have poor GPS signal
3. Wait for GPS to stabilize (30-60 seconds)
4. Move to open area for better accuracy

## Configuration Options

### Adjust Geofence Radius

Change the radius in `components/LocationTracker.tsx`:

```typescript
radius: 100, // Change from 50 to 100 meters
```

### Adjust Notification Cooldown

Change cooldown in `lib/geofencing/background-tracker.ts`:

```typescript
private notificationCooldown: number = 10 * 60 * 1000; // 10 minutes
```

### Adjust Tracking Accuracy

Change options in `background-tracker.ts`:

```typescript
const options: PositionOptions = {
  enableHighAccuracy: true,  // false for battery saving
  timeout: 10000,            // Increase for slower devices
  maximumAge: 0,             // Cache location for X ms
};
```

## Future Enhancements

- [ ] Location history tracking
- [ ] Multiple geofence zones
- [ ] Custom geofence radius per user
- [ ] Route tracking
- [ ] Time-based geofencing (only during work hours)
- [ ] Geofence analytics dashboard
- [ ] Export location reports
- [ ] Integration with attendance system

## Support

For issues or questions:
1. Check browser console for errors
2. Verify permissions are granted
3. Check API logs for errors
4. Contact system administrator

## License

Part of Attendance Tracker System - MIT License
