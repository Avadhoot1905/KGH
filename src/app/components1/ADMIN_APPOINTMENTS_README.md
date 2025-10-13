# Admin Appointments Management System

## Overview
A complete appointment management system for administrators to view, approve, and decline appointment requests from users. The system provides real-time synchronization between user appointments and admin dashboard.

## Components

### 1. **AdminAppointmentsButton.tsx**
- Button component displayed on the mod (admin) page
- Opens the appointments management popup
- Located in the header next to search and create product buttons

### 2. **AdminAppointmentsPopup.tsx**
- Main admin interface for managing appointments
- Features:
  - View all appointment requests
  - Filter by status (All, Pending, Approved, Declined)
  - Approve or decline appointments
  - Display contact information for communication
  - Shows user details (name, email) for each appointment

### 3. **Styling**
- **AdminAppointmentsButton.css**: Styles for the button
- **AdminAppointmentsPopup.css**: Comprehensive styles for the popup interface

## Features

### ✅ For Administrators

#### Appointment Management
- **View All Appointments**: See all appointment requests in one place
- **Filter System**: 
  - All appointments
  - Pending (awaiting action)
  - Approved (confirmed)
  - Declined (rejected)
- **Quick Actions**:
  - Approve button - Confirms the appointment
  - Decline button - Rejects the appointment
- **User Information**: Each appointment shows:
  - User's full name
  - User's email address
  - Requested date and time
  - Reason for visit
  - Current status

#### Contact Information Display
- **Shop Email**: kgh.appointments@example.com
- **Shop Phone**: +1 (555) 123-4567
- Displayed prominently at the top for admin reference
- Shown in declined appointment messages for user follow-up

### 📱 User-Side Integration

#### Updated AppointmentPopup.tsx
Now supports three statuses:
- **Pending**: Awaiting admin approval
- **Approved**: Confirmed by admin
- **Declined**: Rejected by admin

#### Status-Specific Messages
- **Approved**: Shows confirmation with contact details
- **Declined**: Shows rejection notice with contact information for follow-up

### 🔄 Data Synchronization

Currently uses localStorage for demonstration:
- User appointments stored in: `localStorage.appointment`
- Admin appointments list stored in: `localStorage.admin_appointments`
- Automatic sync when user creates appointment

### 📊 Dummy Data

For demonstration, the system includes 3 sample appointments:
1. **John Doe** - Product inquiry (Pending)
2. **Jane Smith** - License assistance (Pending)
3. **Mike Johnson** - Custom order (Approved)

## Installation & Integration

### Already Integrated:
- ✅ AdminAppointmentsButton added to `/mod` page header
- ✅ User AppointmentPopup updated to support all statuses
- ✅ Contact information configured
- ✅ Status synchronization implemented

## Contact Configuration

To update contact details, edit these constants:

**In AdminAppointmentsPopup.tsx:**
```typescript
const CONTACT_EMAIL = "your-email@example.com";
const CONTACT_PHONE = "+1 (555) 123-4567";
```

**In AppointmentPopup.tsx:**
```typescript
const CONTACT_EMAIL = "your-email@example.com";
const CONTACT_PHONE = "+1 (555) 123-4567";
```

## Backend Integration Guide

### Required API Endpoints

#### 1. Get All Appointments (Admin)
```
GET /api/admin/appointments
Response: Array of appointments with user details
```

#### 2. Approve Appointment
```
PATCH /api/admin/appointments/:id/approve
Updates status to 'approved'
```

#### 3. Decline Appointment
```
PATCH /api/admin/appointments/:id/decline
Updates status to 'declined'
```

#### 4. Get User Appointment
```
GET /api/appointments/me
Returns current user's appointment
```

#### 5. Create Appointment
```
POST /api/appointments
Body: { date, time, reason }
Creates new appointment with user info from session
```

### Database Schema Suggestion

```prisma
model Appointment {
  id        String   @id @default(cuid())
  userId    String
  date      String
  time      String
  reason    String
  status    AppointmentStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
}

enum AppointmentStatus {
  PENDING
  APPROVED
  DECLINED
}
```

### Integration Steps

1. **Create Prisma Model** (if using Prisma)
2. **Create API Routes** in `/api/appointments/` and `/api/admin/appointments/`
3. **Replace localStorage calls** with API calls:
   - In `AdminAppointmentsPopup.tsx`: Replace `loadAppointments()` with API fetch
   - In `AppointmentPopup.tsx`: Replace localStorage with API calls
4. **Add Authentication**: Ensure admin-only access to admin routes
5. **Add Real-time Updates**: Consider using WebSockets or polling

## Features by Status

### Pending Appointments
- Yellow/orange indicator
- Shows "Approve" and "Decline" buttons
- Admin can take action

### Approved Appointments
- Green indicator
- Shows confirmation message
- Displays contact information for coordination
- No action buttons (already processed)

### Declined Appointments
- Red indicator
- Shows decline notice with contact details
- Provides follow-up information
- No action buttons (already processed)

## User Experience Flow

1. User clicks floating appointment button
2. Fills out booking form (date, time, reason)
3. Submits appointment request
4. Status shows as "Pending"
5. Admin reviews in mod panel
6. Admin approves or declines
7. User sees updated status in their popup
8. If declined, user sees contact information for follow-up

## Admin Experience Flow

1. Admin navigates to `/mod` page
2. Clicks "View Appointments" button
3. Sees all appointment requests
4. Filters by status if needed
5. Reviews appointment details
6. Clicks "Approve" or "Decline"
7. Status updates immediately
8. User receives updated status

## Styling Consistency

The components maintain consistency with existing design:
- Dark theme (#1a1a1a backgrounds)
- Red accent color (#d32f2f)
- Smooth animations and transitions
- Responsive design for mobile
- Status-based color coding

## Security Considerations

When implementing backend:
- ✅ Validate admin permissions
- ✅ Sanitize user inputs
- ✅ Rate limit appointment creation
- ✅ Validate date/time formats
- ✅ Prevent duplicate appointments
- ✅ Add CSRF protection

## Future Enhancements

- Email notifications on status changes
- SMS reminders for appointments
- Calendar view for admins
- Appointment rescheduling
- Multi-language support
- Export appointment data
- Analytics dashboard
