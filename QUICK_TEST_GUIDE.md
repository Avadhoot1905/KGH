# 🧪 Appointment System - Quick Testing Guide

## ✅ Setup Complete!

- ✅ Database schema synced
- ✅ Prisma Client generated
- ✅ Test data seeded (8 appointments, 5 users)
- ✅ Development server running on http://localhost:3001

---

## 🎯 Quick Test Flow (5 Minutes)

### Step 1: Test User Appointment Booking

1. **Open:** http://localhost:3001
2. **Sign in** with Google OAuth (any account)
3. **Look for** the red floating button (bottom-right) 📍
4. **Click** the appointment button
5. **Fill out form:**
   - Date: Tomorrow
   - Time: 10:00
   - Reason: "Test appointment"
6. **Click "Book Appointment"**
7. **Verify:** See "Appointment Pending" with yellow badge 🟡

### Step 2: Test Admin Approval

1. **Sign in as admin:**
   - Email: `arcsmo19@gmail.com` OR
   - Email: `ojasvikathuria777@gmail.com`
2. **Go to:** http://localhost:3001/mod
3. **Click "View Appointments"** button
4. **See** your test appointment in the list
5. **Click ✓ (Approve)** button
6. **Verify:** Status changes to "Approved" 🟢

### Step 3: Verify User Sees Update

1. **Go back to:** http://localhost:3001
2. **Click** the appointment button again
3. **Verify:** Badge now shows "Approved" 🟢

---

## 🔍 What to Check

### User Side
- [ ] Appointment button visible when signed in
- [ ] Button hidden when not signed in
- [ ] Button NOT visible on `/mod` page
- [ ] Can create new appointment
- [ ] Can see appointment with correct status
- [ ] Can cancel appointment
- [ ] Error if trying to book when already have active appointment

### Admin Side
- [ ] Can view all appointments
- [ ] Can filter by status (All, Pending, Approved, Declined)
- [ ] Can approve appointments
- [ ] Can decline appointments
- [ ] See real-time loading states
- [ ] Statistics show correct counts

### Database
- [ ] New appointments have `PENDING` status
- [ ] Approved appointments have `APPROVED` status
- [ ] Declined appointments have `DECLINED` status
- [ ] Cancelled appointments are deleted
- [ ] User info is correctly linked

---

## 📊 Pre-Seeded Test Data

You can test with these existing appointments:

| User | Status | Date | Time |
|------|--------|------|------|
| john.doe@example.com | PENDING | 2025-10-20 | 10:00 |
| jane.smith@example.com | PENDING | 2025-10-22 | 14:30 |
| mike.johnson@example.com | APPROVED | 2025-10-18 | 11:00 |
| sarah.williams@example.com | PENDING | 2025-10-25 | 09:30 |
| david.brown@example.com | DECLINED | 2025-10-15 | 15:00 |

---

## 🚨 Common Issues & Fixes

### Issue: Appointment button not showing
**Cause:** Not authenticated
**Fix:** Sign in with Google OAuth

### Issue: Can't book appointment
**Cause:** Already have active appointment
**Fix:** Cancel existing appointment first

### Issue: Admin page empty
**Cause:** Not signed in as admin
**Fix:** Sign in with `arcsmo19@gmail.com` or `ojasvikathuria777@gmail.com`

### Issue: Status not updating
**Cause:** Need to refresh
**Fix:** Close and reopen the popup (real-time updates coming in future)

---

## 🎉 Success!

If you can:
1. ✅ Book an appointment as a user
2. ✅ See it in the admin panel
3. ✅ Approve/decline it as admin
4. ✅ See the status update as user

**Then your appointment system is working perfectly! 🚀**

---

## 📚 Full Documentation

See `APPOINTMENT_SYSTEM_COMPLETE.md` for:
- Complete architecture overview
- All server actions documentation
- Security features
- Future enhancement roadmap
- Deployment checklist
- Troubleshooting guide
