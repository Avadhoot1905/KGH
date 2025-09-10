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

export async function toggleWishlist(productId: string) {
  if (!productId) throw new Error("productId is required");

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");
  const userId = user.id;

  // ensure product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const existing = await prisma.wishlist.findFirst({ where: { userId, productId } });
  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return { wishlisted: false } as const;
  }

  await prisma.wishlist.create({ data: { userId, productId } });
  return { wishlisted: true } as const;
}

export type WishlistListItem = {
  id: string;
  name: string;
  price: string;
  tag?: string;
  license: boolean;
  img: string;
};

export async function getMyWishlistItems(): Promise<WishlistListItem[]> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");

  const entries = await prisma.wishlist.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          photos: { select: { url: true, isPrimary: true }, orderBy: { isPrimary: "desc" } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return entries.map((w) => {
    const primary = w.product.photos.find((p) => p.isPrimary) ?? w.product.photos[0];
    return {
      id: w.product.id,
      name: w.product.name,
      price: `₹${Math.round(w.product.price).toLocaleString("en-IN")}`,
      tag: w.product.tag ?? undefined,
      license: Boolean(w.product.licenseRequired),
      img: primary?.url || "/next.svg",
    };
  });
}


