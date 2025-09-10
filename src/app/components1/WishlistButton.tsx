"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAuthState } from "@/actions/auth";

type WishlistButtonProps = {
  productId: string;
  isWishlisted?: boolean;
  className?: string;
};

export default function WishlistButton({ productId, isWishlisted = false, className = "outline" }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const toggleWishlist = async () => {
    if (saving) return;
    
    const auth = await getAuthState();
    if (!auth.isAuthenticated) {
      const current = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      const url = new URL(window.location.href);
      url.searchParams.set("authRequired", "1");
      url.searchParams.set("redirect", current);
      router.replace(url.pathname + "?" + url.searchParams.toString());
      return;
    }
    setSaving(true);
    try {
      // Placeholder for server action to toggle wishlist
      await new Promise((r) => setTimeout(r, 400));
      setWishlisted((w) => !w);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button className={className} onClick={toggleWishlist} aria-pressed={wishlisted}>
        {saving ? "Saving..." : wishlisted ? "💖 Wishlisted" : "❤️ Wishlist"}
      </button>
      <Link href="/Wishlist" className="outline">View Wishlist</Link>
    </div>
  );
}


