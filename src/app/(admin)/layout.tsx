export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { isAdmin } from "@/lib/adminAuth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    redirect("/");
  }

  return (
    <section>
      {children}
    </section>
  );
}
