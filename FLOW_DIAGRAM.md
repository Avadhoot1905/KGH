# Appointment System - Complete Flow Diagram

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER CREATES APPOINTMENT                  │
└─────────────────────────────────────────────────────────────────┘

1. User logs in with Google Auth ✓
   │
2. User sees red floating button (bottom-right)
   │
3. User clicks button
   │
4. AppointmentPopup opens
   │
5. User fills form:
   ├─ Date: 2025-10-20
   ├─ Time: 14:30
   └─ Reason: "Product demonstration"
   │
6. User clicks "Book Appointment"
   │
7. Calls createAppointment() server action
   │
   ┌────────────────────────────────┐
   │  SERVER (appointments.ts)      │
   ├────────────────────────────────┤
   │ ✓ Check authentication         │
   │ ✓ Find user in database        │
   │ ✓ Check no active appointment  │
   │ ✓ Create in database           │
   │   - status: PENDING            │
   │   - userId: user123            │
   │   - date, time, reason         │
   │ ✓ Return appointment data      │
   └────────────────────────────────┘
   │
8. Component shows:
   ├─ Date: October 20, 2025
   ├─ Time: 2:30 PM
   ├─ Reason: Product demonstration
   └─ Status: ⏳ Pending
   │
9. DATABASE UPDATED ✓
   appointments table now has:
   id: apt123
   userId: user123
   status: PENDING
   date: 2025-10-20
   time: 14:30


┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN REVIEWS & APPROVES                       │
└─────────────────────────────────────────────────────────────────┘

1. Admin logs in
   │
2. Admin goes to /mod page
   │
3. Admin clicks "View Appointments" button
   │
4. AdminAppointmentsPopup opens
   │
5. Calls getAllAppointments() server action
   │
   ┌────────────────────────────────┐
   │  SERVER (appointments.ts)      │
   ├────────────────────────────────┤
   │ ✓ Check authentication         │
   │ ✓ Verify admin email           │
   │ ✓ Fetch all from database      │
   │   - Include user details       │
   │   - Order by created date      │
   │ ✓ Return all appointments      │
   └────────────────────────────────┘
   │
6. Component displays:
   ┌──────────────────────────────┐
   │ PENDING (1)                  │
   ├──────────────────────────────┤
   │ John Doe                     │
   │ john.doe@example.com         │
   │ Date: October 20, 2025       │
   │ Time: 2:30 PM                │
   │ Reason: Product demo         │
   │ Status: Pending              │
   │ [Approve] [Decline]          │
   └──────────────────────────────┘
   │
7. Admin clicks "Approve"
   │
8. Calls approveAppointment(apt123) server action
   │
   ┌────────────────────────────────┐
   │  SERVER (appointments.ts)      │
   ├────────────────────────────────┤
   │ ✓ Check authentication         │
   │ ✓ Verify admin email           │
   │ ✓ Update in database:          │
   │   - Find appointment apt123    │
   │   - Set status: APPROVED       │
   │   - Update updatedAt           │
   │ ✓ Return updated appointment   │
   └────────────────────────────────┘
   │
9. Component updates immediately:
   ┌──────────────────────────────┐
   │ APPROVED (1)                 │
   ├──────────────────────────────┤
   │ John Doe                     │
   │ john.doe@example.com         │
   │ Date: October 20, 2025       │
   │ Time: 2:30 PM                │
   │ Reason: Product demo         │
   │ Status: Approved             │
   │ ✓ Appointment confirmed      │
   └──────────────────────────────┘
   │
10. DATABASE UPDATED ✓
    appointments table now has:
    id: apt123
    userId: user123
    status: APPROVED  ← Changed!
    date: 2025-10-20
    time: 14:30


┌─────────────────────────────────────────────────────────────────┐
│                    USER SEES STATUS UPDATE                       │
└─────────────────────────────────────────────────────────────────┘

1. User opens appointment popup again
   │
2. Calls getUserAppointment() server action
   │
   ┌────────────────────────────────┐
   │  SERVER (appointments.ts)      │
   ├────────────────────────────────┤
   │ ✓ Check authentication         │
   │ ✓ Find user in database        │
   │ ✓ Fetch latest appointment     │
   │   - Where userId = user123     │
   │   - Order by createdAt desc    │
   │ ✓ Return appointment           │
   └────────────────────────────────┘
   │
3. Component shows:
   ├─ Date: October 20, 2025
   ├─ Time: 2:30 PM
   ├─ Reason: Product demonstration
   ├─ Status: ✓ Approved  ← Updated!
   └─ Message: "Your appointment has been confirmed!
       We'll contact you at:
       kgh.appointments@example.com | +1 (555) 123-4567"
   │
4. User is happy! ✓


┌─────────────────────────────────────────────────────────────────┐
│                 ALTERNATIVE: ADMIN DECLINES                      │
└─────────────────────────────────────────────────────────────────┘

If admin clicks "Decline" instead:

1. Calls declineAppointment(apt123)
   │
2. Database updated: status = DECLINED
   │
3. User sees:
   ├─ Status: Declined
   └─ Message: "Your appointment request was declined.
       For further details, please contact us:
       Email: kgh.appointments@example.com
       Phone: +1 (555) 123-4567"


┌─────────────────────────────────────────────────────────────────┐
│                     KEY COMPONENTS                               │
└─────────────────────────────────────────────────────────────────┘

Frontend Components:
├─ AppointmentButton.tsx        → Floating red button
├─ AppointmentPopup.tsx         → User booking interface
├─ AdminAppointmentsButton.tsx  → "View Appointments" button
└─ AdminAppointmentsPopup.tsx   → Admin management interface

Server Actions (appointments.ts):
├─ createAppointment()     → User creates
├─ getUserAppointment()    → User views
├─ cancelAppointment()     → User cancels
├─ getAllAppointments()    → Admin views all
├─ approveAppointment()    → Admin approves
├─ declineAppointment()    → Admin declines
└─ getAppointmentStats()   → Admin stats

Database (PostgreSQL):
└─ appointments
   ├─ id (cuid)
   ├─ userId (FK to users)
   ├─ date (string)
   ├─ time (string)
   ├─ reason (text)
   ├─ status (enum: PENDING/APPROVED/DECLINED)
   ├─ createdAt (timestamp)
   └─ updatedAt (timestamp)


┌─────────────────────────────────────────────────────────────────┐
│                     STATUS FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

   User Creates
        │
        ▼
   ┌─────────┐
   │ PENDING │  ← Default status
   └─────────┘
        │
        ├─────────────┐
        │             │
        ▼             ▼
   ┌──────────┐  ┌──────────┐
   │ APPROVED │  │ DECLINED │
   └──────────┘  └──────────┘
   (Admin OK)    (Admin No)
        │             │
        │             │
   [User Happy]  [User Contacts]


┌─────────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                             │
└─────────────────────────────────────────────────────────────────┘

User Not Logged In:
   └─ Floating button: HIDDEN ✗

User Logged In (Normal):
   └─ Floating button: VISIBLE ✓
      └─ Can create/view/cancel appointments

Admin Logged In:
   ├─ On regular pages:
   │  └─ Floating button: VISIBLE ✓
   │     └─ Can book appointments like normal user
   │
   └─ On /mod page:
      ├─ Floating button: HIDDEN ✗
      └─ "View Appointments" button: VISIBLE ✓
         └─ Can view/approve/decline all appointments


┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKS                               │
└─────────────────────────────────────────────────────────────────┘

Every Server Action:
1. getServerSession(authOptions)
   └─ Check if user is logged in
   
2. Find user in database
   └─ Verify user exists

3. For Admin Actions:
   └─ Check email in allowlist:
      ├─ arcsmo19@gmail.com ✓
      └─ ojasvikathuria777@gmail.com ✓

4. For User Actions:
   └─ Verify userId matches session user

5. Database Constraints:
   ├─ Foreign key: userId → users.id
   ├─ Cascade delete: Delete appointments when user deleted
   └─ Indexes: Fast lookups on userId and status


┌─────────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING                                 │
└─────────────────────────────────────────────────────────────────┘

User Side:
├─ Unauthorized
│  └─ "Unauthorized" error
├─ User not found
│  └─ "User not found" error
├─ Already has appointment
│  └─ "You already have an active appointment" error
└─ Network/Server error
   └─ Red error box with message

Admin Side:
├─ Unauthorized/Forbidden
│  └─ Error message
├─ Failed to load
│  └─ Error box + Retry button
└─ Failed to approve/decline
   └─ Error message + retry option


┌─────────────────────────────────────────────────────────────────┐
│                     NEXT STEPS                                   │
└─────────────────────────────────────────────────────────────────┘

1. Run Migration:
   npx prisma migrate dev --name add_appointments

2. Seed Database (Optional):
   npx prisma db seed

3. Start Server:
   npm run dev

4. Test Flow:
   ├─ Log in as user
   ├─ Create appointment
   ├─ Log in as admin
   ├─ Approve appointment
   └─ Check as user again

5. Enjoy! 🎉
```
