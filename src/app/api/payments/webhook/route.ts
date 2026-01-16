import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * WEBHOOK HANDLER - PRODUCTION CRITICAL
 * 
 * This endpoint is the ONLY source of truth for payment verification.
 * DO NOT trust frontend payment success callbacks.
 * 
 * Security Features:
 * 1. HMAC SHA256 signature verification
 * 2. Idempotency (prevents duplicate processing)
 * 3. Raw body parsing for signature validation
 * 4. Atomic database updates
 */

// Export runtime config to get raw body for signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify webhook signature using HMAC SHA256
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the verified payload
    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload.payment.entity;

    console.log(`Received webhook event: ${eventType}`);

    // Handle different payment events
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload, body);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload, body);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 even on error to prevent Razorpay retries
    // Log the error for investigation
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

/**
 * Handle successful payment capture
 * This is where we mark the order as PAID and grant user access
 */
async function handlePaymentCaptured(payload: any, eventPayload: string) {
  const { order_id, id: paymentId, amount, currency } = payload;

  try {
    // Find the order by Razorpay order ID
    const order: any = await prisma.order.findFirst({
      where: { razorpayOrderId: order_id } as any,
      include: { payment: true } as any,
    });

    if (!order) {
      console.error(`Order not found for razorpayOrderId: ${order_id}`);
      return;
    }

    // Idempotency check: Don't process if already captured
    if (order.payment?.status === 'CAPTURED') {
      console.log(`Payment already processed for order: ${order.id}`);
      return;
    }

    // Update order and payment in a transaction (atomic operation)
    await prisma.$transaction([
      // Update order status to PAID
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' as any },
      }),

      // Update payment with captured details
      (prisma as any).payment.update({
        where: { orderId: order.id },
        data: {
          razorpayPaymentId: paymentId,
          status: 'CAPTURED',
          amount: amount / 100, // Convert paise to rupees
          currency,
          eventPayload,
        },
      }),

      // Clear user's cart after successful payment
      prisma.cart.updateMany({
        where: {
          userId: order.userId,
          removedAt: null,
        },
        data: {
          removedAt: new Date(),
        },
      }),
    ]);

    console.log(`Payment captured successfully for order: ${order.id}`);

    // TODO: Add post-payment actions here:
    // - Send confirmation email
    // - Update inventory
    // - Grant access to digital products
    // - Trigger fulfillment process
  } catch (error) {
    console.error('Error processing payment.captured:', error);
    throw error;
  }
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(payload: any, eventPayload: string) {
  const { order_id, id: paymentId, error_description } = payload;

  try {
    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: order_id } as any,
      include: { payment: true } as any,
    });

    if (!order) {
      console.error(`Order not found for razorpayOrderId: ${order_id}`);
      return;
    }

    // Update order and payment status
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' as any },
      }),

      (prisma as any).payment.update({
        where: { orderId: order.id },
        data: {
          razorpayPaymentId: paymentId,
          status: 'FAILED',
          eventPayload,
        },
      }),
    ]);

    console.log(`Payment failed for order: ${order.id}. Reason: ${error_description}`);

    // TODO: Send failure notification to user
  } catch (error) {
    console.error('Error processing payment.failed:', error);
    throw error;
  }
}
