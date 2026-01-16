# 🧪 Payment Integration Testing Guide

## Before You Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Add your credentials to .env.local
RAZORPAY_KEY_ID="rzp_test_xxxx"
RAZORPAY_KEY_SECRET="your_secret_key"
RAZORPAY_WEBHOOK_SECRET="generate_32_char_random_string"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxx"
```

### 2. Database Migration
```bash
# Run migration
npx prisma migrate dev --name add_payment_models

# Or push directly
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 3. Restart TypeScript Server
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
- Type: "TypeScript: Restart TS Server"
- Press Enter

### 4. Start Development Server
```bash
npm run dev
```

## 🧪 Test Scenarios

### Test 1: Unauthenticated User
1. **Log out** if logged in
2. Go to `/Cart`
3. Add items to cart
4. **Expected**: Button shows "Please Sign In" and is disabled
5. ✅ **Pass**: Button is disabled for unauthenticated users

### Test 2: Authenticated User - Successful Payment
1. **Log in** with Google
2. Add items to cart
3. Go to `/Cart`
4. Click "Proceed to Checkout"
5. **Expected**: Razorpay modal opens with pre-filled name/email
6. Use test card: **4111 1111 1111 1111**
   - CVV: 123
   - Expiry: 12/25 (any future date)
7. Complete payment
8. **Expected**: 
   - Success message shown
   - Cart cleared
   - Redirected to profile
9. Check database:
   ```sql
   SELECT * FROM "Order" WHERE status = 'PAID';
   SELECT * FROM payments WHERE status = 'CAPTURED';
   SELECT * FROM "Cart" WHERE removedAt IS NOT NULL;
   ```
10. ✅ **Pass**: Order created, payment captured, cart cleared

### Test 3: Failed Payment
1. Log in
2. Add items to cart
3. Click "Proceed to Checkout"
4. Use test card: **4000 0000 0000 0002**
   - CVV: 123
   - Expiry: 12/25
5. Complete payment
6. **Expected**: Payment fails
7. Check database:
   ```sql
   SELECT * FROM "Order" WHERE status = 'FAILED';
   SELECT * FROM payments WHERE status = 'FAILED';
   ```
8. ✅ **Pass**: Order marked as failed

### Test 4: Webhook Verification (Local)
1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 3000`
3. Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
5. Settings → Webhooks → Create New Webhook
6. Set webhook URL: `https://abc123.ngrok.io/api/payments/webhook`
7. Set secret: Same as `RAZORPAY_WEBHOOK_SECRET` in .env.local
8. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
9. Save webhook
10. Make a test payment
11. **Expected**: Webhook receives event and updates database
12. Check Razorpay Dashboard → Webhooks → Logs
13. ✅ **Pass**: Webhook shows successful delivery

## 📋 Verification Checklist

After each test, verify:

- [ ] Order created in database
- [ ] Payment record created
- [ ] Order items linked correctly
- [ ] User authenticated before checkout
- [ ] Amount calculated correctly
- [ ] Razorpay modal opens
- [ ] User info pre-filled
- [ ] Payment processed
- [ ] Webhook received (if configured)
- [ ] Order status updated
- [ ] Payment status updated
- [ ] Cart cleared after success
- [ ] User redirected properly

## 🔍 Database Queries

### Check Recent Orders
```sql
SELECT 
  o.id,
  o.userId,
  o.total,
  o.status AS orderStatus,
  o.razorpayOrderId,
  p.razorpayPaymentId,
  p.status AS paymentStatus,
  p.amount,
  o.createdAt
FROM "Order" o
LEFT JOIN payments p ON o.id = p.orderId
ORDER BY o.createdAt DESC
LIMIT 10;
```

### Check Cart Status
```sql
SELECT 
  c.id,
  c.userId,
  c.productId,
  c.quantity,
  c.addedAt,
  c.removedAt,
  u.email
FROM "Cart" c
JOIN "User" u ON c.userId = u.id
ORDER BY c.addedAt DESC
LIMIT 10;
```

### Check Payment Events
```sql
SELECT 
  id,
  orderId,
  razorpayPaymentId,
  status,
  amount,
  currency,
  createdAt,
  updatedAt
FROM payments
ORDER BY createdAt DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Issue: "Payment gateway not loaded"
**Solution**: 
- Check browser console for script errors
- Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Wait a few seconds for script to load
- Refresh page

### Issue: "Unauthorized" when clicking checkout
**Solution**:
- Ensure user is logged in
- Check session in browser DevTools
- Clear cookies and re-login

### Issue: Order created but payment not updating
**Solution**:
- Check webhook is configured
- Verify webhook secret matches
- Check Razorpay webhook logs
- Look for errors in server logs
- Ensure ngrok is running (for local testing)

### Issue: Cart not clearing after payment
**Solution**:
- Check webhook received `payment.captured` event
- Verify webhook code executed successfully
- Check database for cart `removedAt` timestamp
- Look for transaction errors in logs

### Issue: TypeScript errors
**Solution**:
```bash
# Clear Prisma cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# If still issues, restart VS Code
```

## 🎯 Test Cards

### Successful Payment
- **Card**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Result**: Payment succeeds

### Failed Payment
- **Card**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Result**: Payment fails

### More Test Cards
See: https://razorpay.com/docs/payments/payments/test-card-details/

## 📊 Expected Flow

```
1. User authenticated ✅
   ↓
2. Cart has items ✅
   ↓
3. Click "Proceed to Checkout" ✅
   ↓
4. Backend creates order ✅
   ↓
5. Razorpay modal opens ✅
   ↓
6. User completes payment ✅
   ↓
7. Webhook verifies payment ✅
   ↓
8. Order status → PAID ✅
   ↓
9. Cart cleared ✅
   ↓
10. User redirected ✅
```

## ✅ Success Criteria

Payment integration is working correctly when:

1. ✅ Unauthenticated users cannot checkout
2. ✅ Authenticated users see pre-filled information
3. ✅ Order is created with PENDING status
4. ✅ Payment record is created
5. ✅ Razorpay modal opens correctly
6. ✅ Test successful payment works
7. ✅ Test failed payment works
8. ✅ Webhook receives and processes events
9. ✅ Order status updates to PAID on success
10. ✅ Cart is cleared after successful payment
11. ✅ All database records are consistent
12. ✅ No TypeScript or runtime errors

## 📞 Getting Help

If you encounter issues:
1. Check this guide first
2. Review `RAZORPAY_SETUP.md` for detailed setup
3. Check `CHANGES_SUMMARY.md` for what was implemented
4. Look at server logs for errors
5. Check Razorpay Dashboard webhook logs
6. Verify all environment variables are set

---

**Ready to test!** Start with Test 1 and work your way through each scenario.
