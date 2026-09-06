import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';

// Initialize Razorpay instance with credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
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
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            licenseRequired: true,
          },
        },
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

    let reqBody = { useWallet: false };
    try {
      reqBody = await req.json();
    } catch {
      // Body empty or not JSON
    }
    const useWallet = Boolean(reqBody.useWallet);

    // Calculate user's wallet balance from returned orders
    const returnedOrders = await prisma.order.findMany({
      where: { userId, status: "RETURNED" },
      select: { total: true }
    });
    const walletBalance = returnedOrders.reduce((sum, o) => sum + o.total, 0);

    const shipping = subtotal * 0.05; // 5% of product subtotal price
    const tax = subtotal * 0.0875;
    const totalBeforeWallet = subtotal + shipping + tax;

    let walletApplied = 0;
    if (useWallet && walletBalance > 0) {
      walletApplied = Math.min(walletBalance, totalBeforeWallet);
    }

    const finalTotal = totalBeforeWallet - walletApplied;
    const amountInPaise = Math.round(finalTotal * 100);

    // If final total after wallet deduction is 0 (100% covered by wallet)
    if (amountInPaise === 0) {
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
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
            discount: walletApplied,
            tax,
            total: 0,
            status: 'PAID',
            razorpayOrderId: `WALLET_${Date.now()}`,
            items: {
              create: cartItems.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
        });

        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            amount: 0,
            currency: 'INR',
            status: 'CAPTURED',
            razorpayPaymentId: `WALLET_PAYMENT_${Date.now()}`,
          },
        });

        await tx.cart.updateMany({
          where: { userId, removedAt: null },
          data: { removedAt: new Date() },
        });

        for (const item of cartItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        return newOrder;
      });

      return NextResponse.json({
        paidWithWallet: true,
        orderId: order.id,
        amount: 0,
      });
    }

    // Create Razorpay order for remaining balance
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId,
        cartItemsCount: cartItems.length.toString(),
        walletApplied: walletApplied.toString(),
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
        discount: walletApplied,
        tax,
        total: finalTotal,
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
        amount: finalTotal,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    // Return order details to frontend
    return NextResponse.json({
      paidWithWallet: false,
      walletApplied,
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

