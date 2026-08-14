"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export type ViewedProductItem = {
  id: string;
  name: string;
  price: string;
  img: string;
};

export async function getRecentlyViewedProducts(limit: number = 8): Promise<ViewedProductItem[]> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return [];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return [];

  const products = await prisma.product.findMany({
    where: { viewedBy: { some: { id: user.id } } },
    include: { photos: { select: { url: true, isPrimary: true }, orderBy: { isPrimary: "desc" } } },
    orderBy: { updatedAt: "desc" },
    take: Math.max(1, Math.min(24, limit)),
  });

  return products.map((p) => {
    const primary = p.photos.find((ph) => ph.isPrimary) ?? p.photos[0];
    return {
      id: p.id,
      name: p.name,
      price: `₹${Math.round(p.price).toLocaleString("en-IN")}`,
      img: primary?.url || "/next.svg",
    };
  });
}

export type OrderListItem = {
  id: string;
  status: string;
  total: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      photos: Array<{ url: string; isPrimary: boolean }>;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
};

export async function getOrdersByStatus(status?: "PENDING" | "COMPLETED" | "CANCELLED"): Promise<OrderListItem[]> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return [];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return [];

  type PrismaOrder = {
    id: string;
    status: string;
    total: number;
    createdAt: Date;
    updatedAt: Date;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    carrier?: string | null;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        id: string;
        name: string;
        photos: Array<{ url: string; isPrimary: boolean }>;
      };
    }>;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = await (prisma as any).order.findMany({
    where: {
      userId: user.id,
      ...(status && { status })
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              photos: {
                select: { url: true, isPrimary: true },
                orderBy: { isPrimary: "desc" }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  }) as PrismaOrder[];

  return orders.map((order: PrismaOrder) => ({
    id: order.id,
    status: order.status,
    total: `₹${Math.round(order.total).toLocaleString("en-IN")}`,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product.id,
        name: item.product.name,
        photos: item.product.photos,
      },
    })),
    createdAt: new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    updatedAt: new Date(order.updatedAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    trackingNumber: order.trackingNumber || null,
    trackingUrl: order.trackingUrl || null,
    carrier: order.carrier || null,
  }));
}

export async function getAllOrders(): Promise<OrderListItem[]> {
  return getOrdersByStatus();
}

export async function createOrderFromCart() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  
  if (!email) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  try {
    const cartItems = await prisma.cart.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    for (const item of cartItems) {
      if (item.product.quantity < item.quantity) {
        return { success: false, error: `Insufficient stock for "${item.product.name}". Only ${item.product.quantity} items left.` };
      }
      if (item.product.licenseRequired) {
        return { success: false, error: `"${item.product.name}" requires a valid arms license. Please contact the store directly.` };
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shippingCost = subtotal * 0.05; // 5% shipping cost
    const total = subtotal + shippingCost;

    // Use transaction to atomically create order, decrement product quantities, and clear cart
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          fullName: user.name ?? "",
          email: user.email ?? "",
          phoneNumber: user.phoneNumber ?? "",
          addressLine1: user.addressLine1 ?? "",
          addressLine2: user.addressLine2 ?? null,
          landmark: user.landmark ?? null,
          city: user.city ?? "",
          state: user.state ?? "",
          country: user.country ?? "",
          pincode: user.pincode ?? "",
          subtotal,
          shippingCost,
          discount: 0,
          tax: 0,
          total,
          status: "PENDING",
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      // 2. Decrement stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Clear cart
      await tx.cart.deleteMany({
        where: { userId: user.id },
      });

      return newOrder;
    });

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export type CheckoutProfileInput = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  alternatePhone?: string;
};

export async function getCurrentUserCheckoutDetails() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return {
      success: false as const,
      error: "Not authenticated",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      name: true,
      email: true,
      phoneNumber: true,
      addressLine1: true,
      addressLine2: true,
      landmark: true,
      city: true,
      state: true,
      country: true,
      pincode: true,
      alternatePhone: true,
      profileCompleted: true,
    },
  });

  if (!user) {
    return {
      success: false as const,
      error: "User not found",
    };
  }

  const profileCompleted = Boolean(user.profileCompleted || (user.name && user.phoneNumber && user.addressLine1 && user.city && user.state && user.country && user.pincode));

  return {
    success: true as const,
    data: {
      fullName: user.name ?? "",
      email: user.email ?? "",
      phoneNumber: user.phoneNumber ?? "",
      addressLine1: user.addressLine1 ?? "",
      addressLine2: user.addressLine2 ?? "",
      landmark: user.landmark ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      country: user.country ?? "",
      pincode: user.pincode ?? "",
      alternatePhone: user.alternatePhone ?? "",
      profileCompleted,
    },
  };
}

export async function saveCheckoutProfile(data: CheckoutProfileInput) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const sanitized = {
      name: data.fullName?.trim() || undefined,
      phoneNumber: data.phoneNumber?.trim() || undefined,
      addressLine1: data.addressLine1?.trim() || undefined,
      addressLine2: data.addressLine2?.trim() || undefined,
      landmark: data.landmark?.trim() || undefined,
      city: data.city?.trim() || undefined,
      state: data.state?.trim() || undefined,
      country: data.country?.trim() || undefined,
      pincode: data.pincode?.trim() || undefined,
      alternatePhone: data.alternatePhone?.trim() || undefined,
      profileCompleted: Boolean(
        data.fullName?.trim() &&
        data.phoneNumber?.trim() &&
        data.addressLine1?.trim() &&
        data.city?.trim() &&
        data.state?.trim() &&
        data.country?.trim() &&
        data.pincode?.trim()
      ),
    };

    const updatedUser = await prisma.user.update({
      where: { email },
      data: sanitized,
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Failed to update checkout profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateUserProfile(data: {
  name?: string;
  phoneNumber?: string;
  contact?: string;
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  
  if (!email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
        ...(data.contact && { contact: data.contact }),
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getAdminOrders() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return [];
  }

  const isAdminUser = await (await import("@/lib/adminAuth")).isAdmin(email);
  if (!isAdminUser) {
    return [];
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, phoneNumber: true } },
      items: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
      payment: true,
    },
  });

  return orders.map((order) => ({
    id: order.id,
    fullName: order.fullName ?? order.user?.name ?? "",
    email: order.email ?? order.user?.email ?? "",
    phoneNumber: order.phoneNumber ?? order.user?.phoneNumber ?? "",
    fullAddress: [order.addressLine1, order.addressLine2, order.landmark]
      .filter(Boolean)
      .join(", "),
    city: order.city ?? "",
    state: order.state ?? "",
    country: order.country ?? "",
    pincode: order.pincode ?? "",
    products: order.items.map((item) => ({
      name: item.product?.name ?? "",
      quantity: item.quantity,
      price: item.price,
    })),
    total: order.total,
    razorpayPaymentId: order.payment?.razorpayPaymentId ?? "",
    paymentStatus: order.payment?.status ?? "PENDING",
    orderStatus: order.status,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber ?? "",
    trackingUrl: order.trackingUrl ?? "",
    carrier: order.carrier ?? "",
  }));
}

export async function updateOrderStatus(orderId: string, status: "PENDING" | "COMPLETED" | "CANCELLED" | "PAID" | "FAILED" | "DELIVERED" | "SHIPPED" | "RETURNED" | "RETURN_REQUESTED") {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return { success: false, error: "Not authenticated" };
  }

  const isAdminUser = await (await import("@/lib/adminAuth")).isAdmin(email);
  if (!isAdminUser) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: "Failed to update order" };
  }
}

export async function updateOrderTracking(orderId: string, trackingNumber: string, trackingUrl: string, carrier?: string) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return { success: false, error: "Not authenticated" };
  }

  const isAdminUser = await (await import("@/lib/adminAuth")).isAdmin(email);
  if (!isAdminUser) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        trackingNumber: trackingNumber || null, 
        trackingUrl: trackingUrl || null,
        carrier: carrier || null
      },
    });

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Failed to update order tracking:", error);
    return { success: false, error: "Failed to update tracking details" };
  }
}

export async function changePassword() {
  // Password change is not available for OAuth accounts
  return { success: false, error: "Password change is not available for OAuth accounts" };
}

export async function getAdminUsers() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return [];
  }

  const isAdminUser = await (await import("@/lib/adminAuth")).isAdmin(email);
  if (!isAdminUser) {
    return [];
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      contact: true,
      role: true,
      phoneNumber: true,
      addressLine1: true,
      addressLine2: true,
      landmark: true,
      city: true,
      state: true,
      country: true,
      pincode: true,
      alternatePhone: true,
      profileCompleted: true,
      createdAt: true,
    },
  });

  return users;
}

export async function getUserAddresses() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return { success: false, error: "Not authenticated", addresses: [] };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { addresses: { orderBy: { createdAt: "desc" } } }
    });
    if (!user) return { success: false, error: "User not found", addresses: [] };
    return { success: true, addresses: user.addresses };
  } catch (error) {
    console.error("Failed to fetch user addresses:", error);
    return { success: false, error: "Failed to fetch addresses", addresses: [] };
  }
}

export async function addAddress(data: {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return { success: false, error: "Not authenticated" };

  // Validate country is India
  const countryCheck = (data.country || '').trim().toLowerCase();
  if (countryCheck && !['india', 'in'].includes(countryCheck)) {
    return { success: false, error: "We only deliver to India. International addresses are not accepted." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "User not found" };

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        country: "India",
        pincode: data.pincode,
      }
    });

    return { success: true, address: newAddress };
  } catch (error) {
    console.error("Failed to add address:", error);
    return { success: false, error: "Failed to add address" };
  }
}

export async function deleteAddress(addressId: string) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return { success: false, error: "Not authenticated" };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "User not found" };

    await prisma.address.deleteMany({
      where: {
        id: addressId,
        userId: user.id
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete address:", error);
    return { success: false, error: "Failed to delete address" };
  }
}

export async function getUserWalletDetails() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return { balance: 0, transactions: [] };

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      orders: {
        where: { status: "RETURNED" },
        select: { id: true, total: true, updatedAt: true }
      }
    }
  });

  if (!user) return { balance: 0, transactions: [] };

  // Calculate balance from returned order credits
  const returnTransactions = user.orders.map((o) => ({
    id: `TX-${o.id.slice(-6)}`,
    type: "CREDIT" as const,
    amount: o.total,
    description: `Refund Credit for Return Order #${o.id.slice(-6)}`,
    date: o.updatedAt,
  }));

  const totalBalance = returnTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    balance: totalBalance,
    transactions: returnTransactions,
  };
}









