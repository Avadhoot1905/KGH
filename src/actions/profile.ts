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
  items: number;
  createdAt: string;
};

// Placeholder: There is no Order model in the schema yet. Return empty list.
export async function getRecentOrders(): Promise<OrderListItem[]> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return [];
  return [];
}








