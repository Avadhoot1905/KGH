import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      total,
      fullName,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      country,
      pincode,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !total) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const existing = await prisma.order.findFirst({
      where: { razorpayOrderId, userId: user.id },
      include: { payment: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found for Razorpay payment' }, { status: 404 });
    }

    const parsedTotal = Number(total);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: existing.id },
        data: {
          status: 'PAID',
          fullName: fullName ?? existing.fullName ?? user.name ?? '',
          email: email ?? existing.email ?? user.email ?? '',
          phoneNumber: phoneNumber ?? existing.phoneNumber ?? user.phoneNumber ?? '',
          addressLine1: addressLine1 ?? existing.addressLine1 ?? user.addressLine1 ?? '',
          addressLine2: addressLine2 ?? existing.addressLine2 ?? user.addressLine2 ?? null,
          landmark: landmark ?? existing.landmark ?? user.landmark ?? null,
          city: city ?? existing.city ?? user.city ?? '',
          state: state ?? existing.state ?? user.state ?? '',
          country: country ?? existing.country ?? user.country ?? '',
          pincode: pincode ?? existing.pincode ?? user.pincode ?? '',
          total: parsedTotal || existing.total,
        },
      }),
      existing.payment
        ? prisma.payment.update({
            where: { id: existing.payment.id },
            data: {
              amount: parsedTotal || existing.total,
              currency: 'INR',
              status: 'CAPTURED',
              razorpayPaymentId,
            },
          })
        : prisma.payment.create({
            data: {
              orderId: existing.id,
              amount: parsedTotal || existing.total,
              currency: 'INR',
              status: 'CAPTURED',
              razorpayPaymentId,
            },
          }),
    ]);

    await prisma.cart.updateMany({ where: { userId: user.id, removedAt: null }, data: { removedAt: new Date() } });

    return NextResponse.json({ success: true, orderId: existing.id });
  } catch (error) {
    console.error('Failed to update order record:', error);
    return NextResponse.json({ error: 'Failed to update order record' }, { status: 500 });
  }
}
