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


