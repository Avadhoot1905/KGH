# Appointment Booking Feature

## Overview
A modular appointment booking system with a floating action button that appears on all pages of the application. The feature allows users to book, view, and cancel appointments.

## Components

### 1. **AppointmentButton.tsx**
- A floating circular button positioned at the bottom-right of every page
- Red gradient background with a calendar icon
- Smooth hover animations and floating effect
- Opens the appointment popup when clicked

### 2. **AppointmentPopup.tsx**
- Modal popup for booking and managing appointments
- Two states:
  - **Booking Form**: When no appointment exists
  - **Appointment Details**: When an appointment is already booked

#### Booking Form Fields:
- **Date**: Date picker with minimum date set to today
- **Time**: Time picker for appointment time
- **Reason**: Textarea for describing the reason for visit

#### Appointment Details View:
- Shows booked appointment information
- Displays status badge (Pending/Approved)
- Provides cancel functionality

### 3. **Styling**
- **AppointmentButton.css**: Styles for the floating button
- **AppointmentPopup.css**: Styles for the modal popup
- Consistent with the existing dark theme of the application
- Fully responsive design

## Features

### ✅ Implemented
- Floating action button on all pages
- Appointment booking form with validation
- View existing appointment details
- Status tracking (Pending/Approved)
- Cancel appointment functionality
- Local storage persistence
- Responsive design
- Smooth animations and transitions
- Dark theme matching existing UI

### 🔄 Ready for Backend Integration
Currently uses localStorage for data persistence. To integrate with backend:

1. Replace localStorage calls with API endpoints:
   - `GET /api/appointments` - Fetch user's appointment
   - `POST /api/appointments` - Create new appointment
   - `DELETE /api/appointments/:id` - Cancel appointment
   - `PATCH /api/appointments/:id` - Update appointment status

2. Add authentication check to verify user is logged in

3. Add real-time status updates from admin panel

## Usage

The component is automatically available on all pages through the root layout. Users can:

1. Click the red floating button at bottom-right
2. Fill in appointment details
3. Submit the booking
4. View their booked appointment
5. Cancel if needed

## Data Structure

```typescript
interface AppointmentData {
  date: string;          // ISO date string
  time: string;          // HH:MM format
  reason: string;        // User's description
  status: 'pending' | 'approved';
  bookedAt: string;      // ISO timestamp
}
```

## Styling Guidelines

The components follow the existing design system:
- Background: `#1a1a1a`
- Borders: `#333`
- Text: `#fff`, `#aaa`, `#888`
- Primary Red: `#d32f2f` to `#b71c1c` gradient
- Border Radius: `8px` (inputs), `12px` (popup)
- Transitions: `0.3s ease`

## Responsive Breakpoints

- Mobile: `max-width: 768px`
  - Smaller button size (50px)
  - Adjusted padding and font sizes
  - Full-width popup (95%)

## Future Enhancements

- Email/SMS notifications
- Calendar integration
- Multiple appointment slots
- Appointment history
- Admin approval workflow
- Recurring appointments
- Appointment reminders
