"use server";

import { PrismaClient, Prisma } from "@prisma/client";
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

export async function removeFromMyWishlist(productId: string) {
  if (!productId) throw new Error("productId is required");
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");
  await prisma.wishlist.deleteMany({ where: { userId: user.id, productId } });
  return { removed: true } as const;
}

export async function moveWishlistItemToCart(productId: string) {
  if (!productId) throw new Error("productId is required");
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");

  await prisma.$transaction(async (tx) => {
    await tx.wishlist.deleteMany({ where: { userId: user.id, productId } });
    const existing = await tx.cart.findFirst({ where: { userId: user.id, productId } });
    if (existing) {
      await tx.cart.update({ where: { id: existing.id }, data: { quantity: existing.quantity + 1 } });
    } else {
      await tx.cart.create({ data: { userId: user.id, productId, quantity: 1 } });
    }
  });
  return { moved: true } as const;
}

export async function moveAllWishlistToCart() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");

  const result = await prisma.$transaction(async (tx) => {
    const entries = await tx.wishlist.findMany({ where: { userId: user.id } });
    if (entries.length === 0) return { moved: 0 } as const;

    for (const entry of entries) {
      const existing = await tx.cart.findFirst({ where: { userId: user.id, productId: entry.productId } });
      if (existing) {
        await tx.cart.update({ where: { id: existing.id }, data: { quantity: existing.quantity + 1 } });
      } else {
        await tx.cart.create({ data: { userId: user.id, productId: entry.productId, quantity: 1 } });
      }
    }
    await tx.wishlist.deleteMany({ where: { userId: user.id } });
    return { moved: entries.length } as const;
  });

  return result;
}

export type RecommendedProduct = {
  id: string;
  name: string;
  price: string;
  img: string;
  brand: string;
  type: string;
};

export async function getWishlistRecommendations(): Promise<RecommendedProduct[]> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return [];
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return [];

  try {
    // Get all wishlist product IDs
    const wishlistEntries = await prisma.wishlist.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });

    if (wishlistEntries.length === 0) return [];

    const wishlistProductIds = wishlistEntries.map((w) => w.productId);

    // Query the join table to get related product IDs for all wishlist items
    const relatedProductIds: { B: string }[] = await prisma.$queryRaw`
      SELECT DISTINCT "B" FROM "_RelatedProducts" 
      WHERE "A" IN (${Prisma.join(wishlistProductIds)})
      AND "B" NOT IN (${Prisma.join(wishlistProductIds)})
      LIMIT 20
    `;

    if (!relatedProductIds || relatedProductIds.length === 0) {
      return [];
    }

    // Fetch full details of those related products
    const ids = relatedProductIds.map((row) => row.B);
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        brand: { select: { name: true } },
        type: { select: { name: true } },
        photos: { select: { url: true, isPrimary: true }, orderBy: { isPrimary: "desc" } },
      },
      take: 12,
    });

    return products.map((p) => {
      const primary = p.photos.find((ph) => ph.isPrimary) ?? p.photos[0];
      return {
        id: p.id,
        name: p.name,
        price: `₹${Math.round(p.price).toLocaleString("en-IN")}`,
        img: primary?.url || "/next.svg",
        brand: p.brand.name,
        type: p.type.name,
      };
    });
  } catch (error) {
    console.error("Error fetching wishlist recommendations:", error);
    return [];
  }
}


