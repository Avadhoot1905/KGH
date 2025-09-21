"use server";

import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const globalAny = global as any;
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


