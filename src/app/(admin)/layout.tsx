export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  // Place allowed admin emails here:
//   const allowedAdmins = [
//     "arcsmo19@gmail.com"
//     "admin2@example.com",
//   ];
  const allowedAdmins: string[] = ["arcsmo19@gmail.com"];

  const userEmail = session.user.email as string;
  if (!allowedAdmins.includes(userEmail)) {
    redirect("/");
  }

  return (
    <section>
      {children}
    </section>
  );
}
