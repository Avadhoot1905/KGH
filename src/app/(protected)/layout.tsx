import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/auth";

export const metadata: Metadata = {
  title: "Protected",
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    const hdrs = await headers();
    const referer = hdrs.get("referer") || "/";
    const destUrl = new URL(referer, referer.startsWith("http") ? undefined : undefined);
    destUrl.searchParams.set("authRequired", "1");
    // Provide a redirect param so client can send user to original page after sign-in
    if (!destUrl.searchParams.get("redirect")) {
      destUrl.searchParams.set("redirect", referer);
    }
    redirect(destUrl.toString());
  }
  return children as React.ReactElement;
}


