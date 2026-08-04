"use server";

import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

export async function getAuthState() {
  const session = await getServerSession(authOptions);
  return {
    isAuthenticated: Boolean(session?.user?.email),
    user: session?.user ?? null,
  };
}

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  contact?: string | null;
  phoneNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  alternatePhone?: string | null;
  profileCompleted?: boolean | null;
  createdAt?: Date | null;
};

// Server action: fetch the current user record from DB
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return null;

  // Lazy import PrismaClient pattern is used in other actions; keep this file light
  const { PrismaClient } = await import("@prisma/client");
  // Reuse global prisma as in other actions to avoid multiple instances in dev
  const globalAny = global as { __PRISMA__?: InstanceType<typeof PrismaClient> };
  let prisma = globalAny.__PRISMA__ as InstanceType<typeof PrismaClient> | undefined;
  if (!prisma) {
    prisma = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalAny.__PRISMA__ = prisma;
    }
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    contact: user.contact ?? null,
    phoneNumber: user.phoneNumber ?? null,
    addressLine1: user.addressLine1 ?? null,
    addressLine2: user.addressLine2 ?? null,
    landmark: user.landmark ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    country: user.country ?? null,
    postalCode: user.pincode ?? null,
    alternatePhone: user.alternatePhone ?? null,
    profileCompleted: user.profileCompleted ?? false,
    createdAt: user.createdAt ?? null,
  };
}

export async function getGoogleSignInUrl(callbackPath?: string) {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const proto = (hdrs.get("x-forwarded-proto") || "http").split(",")[0];
  const baseUrl = host ? `${proto}://${host}` : process.env.NEXTAUTH_URL || "";

  const callbackUrl = new URL(callbackPath || "/", baseUrl).toString();
  const signinUrl = new URL("/api/auth/signin/google", baseUrl);
  signinUrl.searchParams.set("callbackUrl", callbackUrl);
  return signinUrl.toString();
}

export async function registerCredentialsUser(data: { name: string; email: string; phoneNumber: string; password: string }) {
  const { PrismaClient } = await import("@prisma/client");
  const globalAny = global as { __PRISMA__?: InstanceType<typeof PrismaClient> };
  let prisma = globalAny.__PRISMA__ as InstanceType<typeof PrismaClient> | undefined;
  if (!prisma) {
    prisma = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalAny.__PRISMA__ = prisma;
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered. Please sign in instead.");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: hashedPassword,
      profileCompleted: true,
    },
  });

  return { success: true, email: user.email };
}


