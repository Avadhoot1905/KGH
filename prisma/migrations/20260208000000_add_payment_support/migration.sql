-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "public"."OrderStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_razorpayOrderId_key" ON "public"."Order"("razorpayOrderId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "eventPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_orderId_key" ON "public"."payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_razorpayPaymentId_key" ON "public"."payments"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_razorpayPaymentId_idx" ON "public"."payments"("razorpayPaymentId");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
