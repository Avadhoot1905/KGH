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
    const sessionUserId = (session?.user as { id?: string })?.id;
    const email = session?.user?.email ?? null;
    
    if (!email) {
      return { authenticated: false, user: null };
    }

    if (sessionUserId) {
      return {
        authenticated: true,
        user: {
          id: sessionUserId,
          email,
          name: session?.user?.name ?? null,
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
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

export async function getCartCount() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id;
    let userId = sessionUserId;

    if (!userId) {
      const email = session?.user?.email ?? null;
      if (!email) return 0;
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) return 0;
      userId = user.id;
    }

    const count = await prisma.cart.count({
      where: {
        userId,
        removedAt: null,
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting cart count:", error);
    return 0;
  }
}
