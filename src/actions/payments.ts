"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Check if user is authenticated
 * Returns user object or null
 */
export async function checkUserAuthentication() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { authenticated: false, user: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return { authenticated: false, user: null };
    }

    return { authenticated: true, user };
  } catch (error) {
    console.error("Authentication check error:", error);
    return { authenticated: false, user: null };
  }
}

/**
 * Get user's cart count for UI display
 */
export async function getCartCount() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return 0;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return 0;

    const count = await prisma.cart.count({
      where: {
        userId: user.id,
        removedAt: null,
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting cart count:", error);
    return 0;
  }
}
