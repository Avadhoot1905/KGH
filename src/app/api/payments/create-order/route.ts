import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';

// Initialize Razorpay instance with credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST() {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;

    // Fetch cart items from database (server-side calculation)
    const cartItems = await prisma.cart.findMany({
      where: {
        userId,
        removedAt: null,
      },
      include: {
        product: true,
      },
    });

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate total amount securely on the server
    const subtotal = cartItems.reduce(
      (acc: number, item: { product: { price: number }, quantity: number }) => acc + item.product.price * item.quantity,
      0
    );
    const shipping = 9.99;
    const tax = subtotal * 0.0875;
    const total = subtotal + shipping + tax;

    // Convert to paise (smallest currency unit for INR)
    const amountInPaise = Math.round(total * 100);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId,
        cartItemsCount: cartItems.length.toString(),
      },
    });

    // Store order in database with PENDING status
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
        items: {
          create: cartItems.map((item: { product: { id: string, price: number }, quantity: number }) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // Create payment record with PENDING status
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: total,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    // Return order details to frontend
    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error creating order:', errorMessage);
    console.error('Full error:', error);
    return NextResponse.json(
      { error: `Failed to create order: ${errorMessage}` },
      { status: 500 }
    );
  }
}

