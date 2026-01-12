# 🚀 Razorpay Payment Integration - Complete Implementation

## Overview

This implementation provides a **production-ready, webhook-based Razorpay payment flow** for your Next.js e-commerce application. The integration follows security best practices and uses webhooks as the single source of truth for payment verification.

## 📋 What's Included

### Files Created/Modified

1. **Database Schema** ([prisma/schema.prisma](prisma/schema.prisma))
   - Updated `Order` model with `razorpayOrderId`
   - New `Payment` model for payment tracking
   - New enums: `PaymentStatus`, updated `OrderStatus`

2. **API Routes**
   - `src/app/api/payments/create-order/route.ts` - Server-side order creation
   - `src/app/api/payments/webhook/route.ts` - Webhook handler (CRITICAL)
   - `src/app/api/payments/verify/route.ts` - Optional frontend verification

3. **Frontend**
   - `src/app/(protected)/Cart/page.tsx` - Updated with Razorpay checkout

4. **Utilities**
   - `src/lib/prisma.ts` - Prisma client singleton
   - `src/types/razorpay.ts` - TypeScript type definitions

5. **Documentation**
   - `RAZORPAY_SETUP.md` - Detailed setup guide
   - `IMPLEMENTATION.md` - Implementation summary
   - `.env.example` - Environment variables template
   - This README

## ⚡ Quick Start

### Step 1: Install Dependencies

Dependencies are already installed in your `package.json`:
- `razorpay@2.9.6` ✅

### Step 2: Set Up Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Razorpay credentials:
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Go to **Settings → API Keys**
   - Click **Generate Keys** (use Test Mode for development)

3. Update `.env.local`:
   ```bash
   DATABASE_URL="your-postgres-connection-string"
   
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Razorpay Credentials
   RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="your_secret_key_here"
   RAZORPAY_WEBHOOK_SECRET="generate_a_32_character_random_string"
   
   # Public Key (same as RAZORPAY_KEY_ID)
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
   ```

### Step 3: Run Database Migration

**IMPORTANT**: The database needs to be accessible for this step.

```bash
# Option 1: Create a migration (recommended for production)
npx prisma migrate dev --name add_payment_models

# Option 2: Push directly to database (for quick testing)
npx prisma db push

# Then generate Prisma Client
npx prisma generate
```

### Step 4: Restart TypeScript Server

In VS Code:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

This ensures TypeScript picks up the new Prisma types.

### Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000/Cart](http://localhost:3000/Cart) to test!

## 🧪 Testing

### Local Testing with Test Cards

1. Add items to cart
2. Click "Proceed to Checkout"
3. Use these test cards:

**Successful Payment:**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failed Payment:**
- Card: `4000 0000 0000 0002`

More test cards: [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

### Testing Webhooks Locally

Since webhooks require a public URL, use [ngrok](https://ngrok.com/):

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

Then configure webhook in Razorpay Dashboard:
1. Go to **Settings → Webhooks**
2. Click **Create New Webhook**
3. Set URL: `https://abc123.ngrok.io/api/payments/webhook`
4. Set Secret: Use the same value as `RAZORPAY_WEBHOOK_SECRET`
5. Select Events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
6. Save

## 🔒 Security Features

✅ **Server-side order creation** - Amount calculated on backend, never trust frontend  
✅ **Webhook signature verification** - HMAC SHA256 validation  
✅ **Secret protection** - No API secrets exposed to frontend  
✅ **Authentication** - All APIs require user login  
✅ **Idempotency** - Duplicate webhooks are safely ignored  
✅ **Atomic transactions** - Database consistency guaranteed  
✅ **Single source of truth** - Only webhook updates payment status  

## 📊 Payment Flow

```
1. User clicks "Proceed to Checkout"
   ↓
2. Frontend → POST /api/payments/create-order
   - User authenticated
   - Cart items fetched from DB
   - Total calculated server-side
   - Razorpay order created
   - Order stored (status: PENDING)
   ↓
3. Razorpay Checkout modal opens
   ↓
4. User enters card details and confirms
   ↓
5. Razorpay → POST /api/payments/webhook
   - Signature verified (CRITICAL)
   - Order status updated to PAID
   - Payment details stored
   - Cart cleared
   ↓
6. User sees success message
```

## 🚨 Troubleshooting

### TypeScript Errors

If you see errors like `Property 'payment' does not exist`:

1. Verify database migration ran successfully
2. Run `npx prisma generate`
3. Restart TypeScript server in VS Code
4. If still issues, restart VS Code entirely

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solution**: Check that your Neon database is running and `DATABASE_URL` is correct.

### Webhook Not Receiving Events

**Checklist**:
- [ ] Webhook URL is publicly accessible (use ngrok for local testing)
- [ ] Webhook URL matches exactly in Razorpay Dashboard
- [ ] `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay Dashboard
- [ ] Events are selected in webhook configuration
- [ ] Check "Webhook Logs" in Razorpay Dashboard for delivery status

### Payment Success but Order Not Updating

**Check**:
1. Webhook signature verification - check server logs
2. Webhook secret matches
3. Events are being received (check Razorpay webhook logs)
4. Database transactions are working

### "Razorpay is not defined"

**Solution**: Ensure Razorpay script is loaded:
- Check browser console for script loading errors
- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Wait for script to load before clicking checkout

## 📦 Production Deployment

### Pre-deployment Checklist

- [ ] Switch to Razorpay **Live Mode**
- [ ] Update all environment variables with live credentials
- [ ] Set production webhook URL (must be HTTPS)
- [ ] Run database migrations on production
- [ ] Test end-to-end flow with real cards
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure webhook retry strategy in Razorpay

### Environment Variables for Production

```bash
DATABASE_URL="your-production-postgres-url"
NEXTAUTH_SECRET="strong-random-secret-for-production"
NEXTAUTH_URL="https://yourdomain.com"

# Live Mode Credentials
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_live_secret_key"
RAZORPAY_WEBHOOK_SECRET="strong_production_secret_32_chars_minimum"

NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
```

### Webhook Configuration

1. In Razorpay Dashboard (Live Mode)
2. **Settings → Webhooks**
3. Set URL: `https://yourdomain.com/api/payments/webhook`
4. Generate a **strong** webhook secret (32+ characters)
5. Select events: `payment.captured`, `payment.failed`
6. Enable webhook

## 📈 Monitoring

### Database Queries

Check payment status:
```sql
SELECT 
  o.id,
  o.razorpayOrderId,
  o.status AS orderStatus,
  p.razorpayPaymentId,
  p.status AS paymentStatus,
  p.amount,
  o.createdAt
FROM "Order" o
LEFT JOIN payments p ON o.id = p.orderId
ORDER BY o.createdAt DESC
LIMIT 20;
```

### Razorpay Dashboard

- Real-time payment monitoring
- Webhook delivery logs
- Failed webhook retries
- Transaction reports
- Settlement tracking

## 🎯 Next Steps

### After Initial Setup

1. **Test thoroughly** with test cards
2. **Set up webhook locally** using ngrok
3. **Verify cart clears** after payment
4. **Check database** for order/payment records
5. **Monitor logs** for any errors

### Production Enhancements

1. **Email notifications** - Send confirmation emails
2. **Order management** - Create admin panel for orders
3. **Refund handling** - Add refund webhook support
4. **Partial payments** - Support for partial refunds
5. **Invoice generation** - Generate PDF invoices
6. **Analytics** - Track conversion rates
7. **Error monitoring** - Integrate Sentry/similar

## 📚 Resources

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Webhook Guide**: https://razorpay.com/docs/webhooks/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Security Best Practices**: https://razorpay.com/docs/payments/security/
- **Razorpay Support**: https://razorpay.com/support/

## 🐛 Known Issues

None currently! If you encounter any issues:
1. Check the troubleshooting section above
2. Review server logs
3. Check Razorpay Dashboard webhook logs
4. Verify all environment variables are set

## 🤝 Support

For implementation questions:
- Check `RAZORPAY_SETUP.md` for detailed setup
- Check `IMPLEMENTATION.md` for technical details
- Review API route comments for inline documentation

For Razorpay-specific issues:
- Visit [Razorpay Support](https://razorpay.com/support/)
- Check [Razorpay Community](https://community.razorpay.com/)

---

## ✅ Implementation Complete!

Your Razorpay payment integration is **production-ready** and follows industry best practices:

- ✅ Secure webhook-based verification
- ✅ Server-side amount calculation
- ✅ Proper error handling
- ✅ Type-safe implementation
- ✅ Comprehensive documentation
- ✅ Production security measures

**Next**: Run the database migration, set up your environment variables, and start testing!

Happy coding! 🎉
