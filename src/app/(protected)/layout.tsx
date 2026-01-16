export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // If not logged in, redirect to home
  if (!session?.user?.email) {
    redirect("/");
  }

  // Any authenticated user (NORMAL_USER or ADMIN) can access protected routes
  return (
    <section>
      {children}
    </section>
  );
}