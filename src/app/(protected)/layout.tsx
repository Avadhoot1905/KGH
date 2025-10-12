export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

type Session = {
  user?: SessionUser;
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = (await getServerSession(authOptions)) as Session;

  // If not logged in, redirect to home
  if (!session?.user?.email) {
    redirect("/");
  }


  // Fetch user from Prisma to get the latest role
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true },
  });

  // Debug: log dbUser to server console
  console.log("AdminLayout dbUser:", dbUser);

  // If not an admin, redirect to home
  if (dbUser?.role !== "ADMIN") {
    redirect("/");
  }

  // If admin, render children
  return (
    <section>
      {children}
    </section>
  );
}