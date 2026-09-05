"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { CartWishlistProvider } from "@/app/context/CartWishlistContext";

export default function NextAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartWishlistProvider>{children}</CartWishlistProvider>
    </SessionProvider>
  );
}
