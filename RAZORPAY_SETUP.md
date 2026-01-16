# Razorpay Payment Integration - Setup Guide

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```bash
# Database
DATABASE_URL="your-neon-postgresql-connection-string"

# NextAuth (if applicable)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Razorpay Configuration
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Public Razorpay Key (exposed to frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"
```

## Getting Razorpay Credentials

### 1. Sign up for Razorpay
- Go to [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
- Create an account
- Complete KYC verification for live mode

### 2. Get API Keys
1. Log in to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Keys** (Test Mode or Live Mode)
4. Copy both:
   - **Key ID** → Use for `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → Use for `RAZORPAY_KEY_SECRET`

### 3. Set Up Webhook
1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/payments/webhook`
   - **Secret**: Generate a strong random string (32+ characters)
   - **Active Events**: Select:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - (Optional) `payment.authorized`, `order.paid`, etc.
4. Save and copy the **Secret** → Use for `RAZORPAY_WEBHOOK_SECRET`

## Database Migration

Run the Prisma migration to create the new Payment models:

```bash
npx prisma migrate dev --name add_payment_models
```

Or if you want to push directly to the database:

```bash
npx prisma db push
```

## Testing the Integration

### Local Testing (Test Mode)
1. Use Razorpay **Test Mode** credentials
2. Start your development server:
   ```bash
   npm run dev
   ```
3. Go to the Cart page and click "Proceed to Checkout"
4. Use [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/):
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

### Testing Webhooks Locally
Since webhooks require a public URL, use [ngrok](https://ngrok.com/) or similar:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Use the ngrok URL in Razorpay webhook settings
# Example: https://abc123.ngrok.io/api/payments/webhook
```

## Production Deployment

### Pre-deployment Checklist
- [ ] Switch to **Live Mode** in Razorpay Dashboard
- [ ] Update all environment variables with live credentials
- [ ] Set webhook URL to production domain
- [ ] Enable HTTPS (required for Razorpay)
- [ ] Test payment flow end-to-end
- [ ] Monitor webhook logs in Razorpay Dashboard

### Security Best Practices
✅ **NEVER** expose `RAZORPAY_KEY_SECRET` to the frontend  
✅ **ALWAYS** verify webhook signatures  
✅ Use webhook as the ONLY source of truth for payments  
✅ Implement idempotency to handle duplicate webhooks  
✅ Use HTTPS in production  
✅ Store webhook secrets securely  
✅ Log all webhook events for debugging  

## Payment Flow

```
1. User clicks "Proceed to Checkout" on Cart page
   ↓
2. Frontend calls POST /api/payments/create-order
   ↓
3. Backend:
   - Authenticates user
   - Fetches cart items from DB
   - Calculates total securely
   - Creates Razorpay order
   - Stores order in DB (status: PENDING)
   - Returns order_id to frontend
   ↓
4. Frontend opens Razorpay Checkout modal
   ↓
5. User completes payment
   ↓
6. Razorpay sends webhook to POST /api/payments/webhook
   ↓
7. Webhook handler:
   - Verifies signature (CRITICAL)
   - Updates order status to PAID
   - Stores payment details
   - Clears user cart
   ↓
8. User sees success message
```

## Troubleshooting

### Common Issues

**Issue**: "Payment gateway not loaded"
- **Solution**: Ensure Razorpay script is loaded before checkout
- Check browser console for script loading errors

**Issue**: "Invalid signature" in webhook
- **Solution**: 
  - Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay Dashboard
  - Ensure raw body is used for signature verification
  - Check webhook URL is correct

**Issue**: Order created but payment not updating
- **Solution**:
  - Check webhook is configured in Razorpay Dashboard
  - Verify webhook URL is publicly accessible
  - Check webhook logs in Razorpay Dashboard
  - Look for errors in server logs

**Issue**: Cart not clearing after payment
- **Solution**: Check webhook is successfully processing `payment.captured` event

## Monitoring

### Check Payment Status
```sql
-- View all orders with payment status
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
ORDER BY o.createdAt DESC;
```

### Razorpay Dashboard
- Monitor payments in real-time
- View webhook delivery logs
- Check for failed webhooks
- Download transaction reports

## Support
- Razorpay Docs: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- Razorpay Support: [https://razorpay.com/support/](https://razorpay.com/support/)
