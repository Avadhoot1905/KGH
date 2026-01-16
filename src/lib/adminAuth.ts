"use server";

import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global {
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

/**
 * Check if a user is an admin based on their email address
 * @param email - The user's email address
 * @returns true if the user has ADMIN role in the database, false otherwise
 */
export async function isAdmin(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
