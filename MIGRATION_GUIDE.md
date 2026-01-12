# Database Migration Instructions

## Important: Run This Before Testing!

The payment integration requires new database tables. Follow these steps:

## Option 1: Create Migration (Recommended for Production)

This creates a migration file that can be version controlled and rolled back if needed.

```bash
npx prisma migrate dev --name add_payment_models
```

This will:
1. Create the migration file
2. Apply it to your database
3. Generate the Prisma client

## Option 2: Direct Push (Quick for Development)

This directly pushes schema changes to your database without creating migration files.

```bash
npx prisma db push
```

Then generate the client:
```bash
npx prisma generate
```

## What Gets Created

### New Tables

#### `payments` table
- `id` - Unique identifier
- `orderId` - Link to Order (unique)
- `razorpayPaymentId` - Razorpay payment ID
- `razorpaySignature` - Payment signature
- `status` - PENDING, CAPTURED, FAILED, REFUNDED
- `amount` - Payment amount
- `currency` - Currency (default: INR)
- `eventPayload` - Full webhook event data
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Modified Tables

#### `Order` table - New Columns
- `razorpayOrderId` - Razorpay order ID (unique)

#### `OrderStatus` enum - New Values
- `PAID` - Payment captured successfully
- `FAILED` - Payment failed

### New Enums

#### `PaymentStatus`
- `PENDING` - Payment initiated
- `CAPTURED` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

## Verification

After running the migration, verify it worked:

### Check Tables Exist
```sql
-- Check payments table
SELECT * FROM payments LIMIT 1;

-- Check Order has new column
SELECT id, razorpayOrderId FROM "Order" LIMIT 1;
```

### Check Enums
```sql
-- Check PaymentStatus enum values
SELECT enum_range(NULL::PaymentStatus);

-- Check OrderStatus includes PAID and FAILED
SELECT enum_range(NULL::OrderStatus);
```

## Rollback (If Needed)

If you used migrations and need to rollback:

```bash
# Reset to previous migration
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Re-run all migrations except the last one
# 3. Re-seed the database (if you have a seed file)
```

## After Migration

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Restart TypeScript Server
In VS Code:
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type: "TypeScript: Restart TS Server"
- Press Enter

### 3. Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Troubleshooting

### Error: "Migration failed"
**Cause**: Database connection issue
**Solution**: 
- Check `DATABASE_URL` in `.env`
- Ensure Neon database is running
- Try again

### Error: "Column already exists"
**Cause**: Migration was partially applied
**Solution**:
```bash
# Reset and re-run
npx prisma migrate reset
npx prisma migrate dev --name add_payment_models
```

### Error: "Prisma client doesn't recognize new fields"
**Solution**:
```bash
# Clear cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate

# Restart TypeScript server
# Restart VS Code if needed
```

## Schema Changes Summary

```diff
model Order {
  id               String      @id @default(cuid())
  userId           String
  total            Float
  status           OrderStatus @default(PENDING)
+ razorpayOrderId  String?     @unique
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  user             User        @relation(...)
  items            OrderItem[]
+ payment          Payment?
}

enum OrderStatus {
  PENDING
+ PAID
  COMPLETED
  CANCELLED
+ FAILED
}

+ model Payment {
+   id                String        @id @default(cuid())
+   orderId           String        @unique
+   razorpayPaymentId String?       @unique
+   razorpaySignature String?
+   status            PaymentStatus @default(PENDING)
+   amount            Float
+   currency          String        @default("INR")
+   eventPayload      String?       @db.Text
+   createdAt         DateTime      @default(now())
+   updatedAt         DateTime      @updatedAt
+   order             Order         @relation(...)
+
+   @@index([razorpayPaymentId])
+   @@map("payments")
+ }

+ enum PaymentStatus {
+   PENDING
+   CAPTURED
+   FAILED
+   REFUNDED
+ }
```

## Production Deployment

For production, use migrations:

```bash
# On your local machine
npx prisma migrate dev --name add_payment_models

# Commit the migration files
git add prisma/migrations
git commit -m "Add payment models"
git push

# On production server
npx prisma migrate deploy
```

This ensures migrations are version controlled and reproducible.

---

**Status**: Ready to migrate! Choose Option 1 for production or Option 2 for quick testing.
