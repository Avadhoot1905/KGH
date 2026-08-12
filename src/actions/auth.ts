"use server";

import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

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
    // Use the shared prisma client

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


