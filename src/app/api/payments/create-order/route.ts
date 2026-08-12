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

    const profileCompleted = Boolean(
      user.profileCompleted ||
      (user.name && user.phoneNumber && user.addressLine1 && user.city && user.state && user.country && user.pincode)
    );

    if (!profileCompleted) {
      return NextResponse.json(
        { error: 'Please complete your profile before proceeding to payment.' },
        { status: 400 }
      );
    }

    const country = (user.country || '').trim().toLowerCase();
    if (country && !['india', 'in'].includes(country)) {
      return NextResponse.json(
        { error: 'We only deliver to India. International orders are not accepted.' },
        { status: 400 }
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

    // Validate stock and license required for each item
    for (const item of cartItems) {
      if (item.product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${item.product.name}". Only ${item.product.quantity} items left.` },
          { status: 400 }
        );
      }
      if (item.product.licenseRequired) {
        return NextResponse.json(
          { error: `"${item.product.name}" requires a valid arms license. Please contact the store directly.` },
          { status: 400 }
        );
      }
    }

    const shipping = subtotal * 0.05; // 5% of product subtotal price
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
        fullName: user.name ?? '',
        email: user.email ?? '',
        phoneNumber: user.phoneNumber ?? '',
        addressLine1: user.addressLine1 ?? '',
        addressLine2: user.addressLine2 ?? null,
        landmark: user.landmark ?? null,
        city: user.city ?? '',
        state: user.state ?? '',
        country: user.country ?? '',
        pincode: user.pincode ?? '',
        subtotal,
        shippingCost: shipping,
        discount: 0,
        tax,
        total,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
        items: {
          create: cartItems.map((item) => ({
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

