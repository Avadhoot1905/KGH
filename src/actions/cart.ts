"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function addToCart(productId: string, quantity: number = 1) {
  if (!productId) throw new Error("productId is required");
  if (quantity <= 0) throw new Error("quantity must be positive");

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");
  const userId = user.id;

  // Ensure product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (product.quantity <= 0) {
    throw new Error("OUT_OF_STOCK");
  }

  // Upsert cart item (increment quantity if already exists)
  const existing = await prisma.cart.findFirst({ where: { userId, productId } });
  const currentQty = existing?.quantity ?? 0;
  const targetQty = currentQty + quantity;

  if (targetQty > product.quantity) {
    throw new Error(`MAX_STOCK_EXCEEDED: Cannot add more than available stock (${product.quantity})`);
  }

  if (existing) {
    return prisma.cart.update({
      where: { id: existing.id },
      data: { quantity: targetQty },
    });
  }

  return prisma.cart.create({
    data: { userId, productId, quantity: targetQty },
  });
}

export async function getCartQuantitiesMap(): Promise<Record<string, number>> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return {};
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return {};

  const entries = await prisma.cart.findMany({
    where: { userId: user.id },
    select: { productId: true, quantity: true },
  });

  const map: Record<string, number> = {};
  for (const item of entries) {
    map[item.productId] = item.quantity;
  }
  return map;
}

export async function getCartQuantityForProduct(productId: string) {
  if (!productId) throw new Error("productId is required");

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return { quantity: 0 };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { quantity: 0 };

  const existing = await prisma.cart.findFirst({
    where: { userId: user.id, productId },
    select: { quantity: true },
  });

  return { quantity: existing?.quantity ?? 0 };
}

export async function updateProductQuantityInCart(productId: string, delta: number) {
  if (!productId) throw new Error("productId is required");
  if (!delta) return { quantity: 0 };

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error("UNAUTHENTICATED");

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { quantity: true } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const existing = await prisma.cart.findFirst({ where: { userId: user.id, productId }, select: { id: true, quantity: true } });

  if (!existing) {
    if (delta <= 0) return { quantity: 0 };
    if (product.quantity <= 0) throw new Error("OUT_OF_STOCK");
    await prisma.cart.create({ data: { userId: user.id, productId, quantity: 1 } });
    return { quantity: 1 };
  }

  const nextQty = existing.quantity + delta;

  if (nextQty <= 0) {
    await prisma.cart.delete({ where: { id: existing.id } });
    return { quantity: 0 };
  }

  if (nextQty > product.quantity) {
    throw new Error(`MAX_STOCK_EXCEEDED: Maximum available stock is ${product.quantity}`);
  }

  await prisma.cart.update({ where: { id: existing.id }, data: { quantity: nextQty } });
  return { quantity: nextQty };
}

export type CartListItem = {
  id: string;
  productId: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
};

export async function getMyCartItems(): Promise<CartListItem[]> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");

  const entries = await prisma.cart.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          brands: { select: { name: true } },
          categories: { select: { name: true } },
          photos: { select: { url: true, isPrimary: true }, orderBy: { isPrimary: "desc" } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return entries.map((c) => {
    const primary = c.product.photos.find((p) => p.isPrimary) ?? c.product.photos[0];
    return {
      id: c.id,
      productId: c.productId,
      name: c.product.name,
      category: c.product.categories.map((cat: { name: string }) => cat.name).join(", "),
      brand: c.product.brands.map((b: { name: string }) => b.name).join(", "),
      price: c.product.price,
      quantity: c.quantity,
      image: primary?.url || "/next.svg",
    };
  });
}

export async function removeCartItem(cartItemId: string) {
  if (!cartItemId) throw new Error("cartItemId is required");
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");

  await prisma.cart.deleteMany({ where: { id: cartItemId, userId: user.id } });
  return { removed: true } as const;
}

export async function updateCartItemQuantity(cartItemId: string, delta: number) {
  if (!cartItemId) throw new Error("cartItemId is required");
  if (!delta) return { noop: true } as const;

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");

  const current = await prisma.cart.findFirst({ where: { id: cartItemId, userId: user.id } });
  if (!current) throw new Error("CART_ITEM_NOT_FOUND");

  const nextQty = (current.quantity || 0) + delta;
  if (nextQty <= 0) {
    await prisma.cart.delete({ where: { id: current.id } });
    return { deleted: true } as const;
  }

  const updated = await prisma.cart.update({ where: { id: current.id }, data: { quantity: nextQty } });
  return { quantity: updated.quantity } as const;
}

export async function moveCartItemToWishlist(cartItemId: string, productId: string) {
  if (!cartItemId || !productId) throw new Error("cartItemId and productId are required");
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("UNAUTHENTICATED");

  return prisma.$transaction(async (tx) => {
    // 1. Delete from cart
    await tx.cart.deleteMany({ where: { id: cartItemId, userId: user.id } });
    
    // 2. Add to wishlist if not already there
    const existingWishlist = await tx.wishlist.findFirst({ where: { userId: user.id, productId } });
    if (!existingWishlist) {
      await tx.wishlist.create({ data: { userId: user.id, productId } });
    }
    
    return { success: true };
  });
}



