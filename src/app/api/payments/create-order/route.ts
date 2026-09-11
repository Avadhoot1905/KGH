import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay API keys are missing in server environment (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }

  return new Razorpay({ key_id, key_secret });
}

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

    let reqBody: { useWallet?: boolean; selectedItemIds?: string[] } = { useWallet: false };
    try {
      reqBody = await req.json();
    } catch {
      // Body empty or not JSON
    }
    const useWallet = Boolean(reqBody.useWallet);
    const selectedIds = Array.isArray(reqBody.selectedItemIds) && reqBody.selectedItemIds.length > 0
      ? new Set(reqBody.selectedItemIds)
      : null;

    // Filter cart items by selected IDs if passed
    const activeCartItems = selectedIds
      ? cartItems.filter((item) => selectedIds.has(item.id))
      : cartItems;

    if (!activeCartItems || activeCartItems.length === 0) {
      return NextResponse.json(
        { error: 'No items selected for checkout' },
        { status: 400 }
      );
    }

    // Calculate total amount securely on the server
    const subtotal = activeCartItems.reduce(
      (acc: number, item: { product: { price: number }, quantity: number }) => acc + item.product.price * item.quantity,
      0
    );

    // Validate stock and license required for each item
    for (const item of activeCartItems) {
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

    const activeItemIds = activeCartItems.map((item) => item.id);

    // If final total after wallet deduction is 0 or less than ₹1 (100 paise)
    if (amountInPaise < 100) {
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
            discount: totalBeforeWallet,
            tax,
            total: 0,
            status: 'PAID',
            razorpayOrderId: `WALLET_${Date.now()}`,
            items: {
              create: activeCartItems.map((item) => ({
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
          where: { id: { in: activeItemIds }, userId },
          data: { removedAt: new Date() },
        });

        for (const item of activeCartItems) {
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
    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId,
        cartItemsCount: activeCartItems.length.toString(),
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
          create: activeCartItems.map((item) => ({
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
  } catch (error: unknown) {
    let errorMessage = "Failed to create order";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.description === "string") {
        errorMessage = errObj.description;
      } else if (typeof errObj.error === "string") {
        errorMessage = errObj.error;
      } else if (typeof errObj.error === "object" && errObj.error !== null) {
        const nestedErr = errObj.error as Record<string, unknown>;
        if (typeof nestedErr.description === "string") {
          errorMessage = nestedErr.description;
        } else {
          errorMessage = JSON.stringify(nestedErr);
        }
      } else {
        errorMessage = JSON.stringify(error);
      }
    } else {
      errorMessage = String(error);
    }
    console.error('❌ Error creating order:', errorMessage);
    console.error('Full error:', error);
    return NextResponse.json(
      { error: `Failed to create order: ${errorMessage}` },
      { status: 500 }
    );
  }
}

