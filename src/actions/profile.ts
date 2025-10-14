"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

let prisma: PrismaClient;
declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__PRISMA__) {
    global.__PRISMA__ = new PrismaClient();
  }
  prisma = global.__PRISMA__;
}

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

    if (cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const order = await (prisma as any).order.create({
      data: {
        userId: user.id,
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

    // Clear the cart after creating order
    await prisma.cart.deleteMany({
      where: { userId: user.id },
    });

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to create order" };
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

export async function changePassword() {
  // Password change is not available for OAuth accounts
  return { success: false, error: "Password change is not available for OAuth accounts" };
}








