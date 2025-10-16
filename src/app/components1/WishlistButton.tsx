"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { toggleWishlist as toggleWishlistAction } from "@/actions/wishlist";

type WishlistButtonProps = {
  productId: string;
  isWishlisted?: boolean;
  className?: string;
};

function WishlistButtonInner({ productId, isWishlisted = false, className = "outline" }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const onToggleWishlist = async () => {
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
      const result = await toggleWishlistAction(productId);
      setWishlisted(result.wishlisted);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button className={className} onClick={onToggleWishlist} aria-pressed={wishlisted}>
        {saving ? "Saving..." : wishlisted ? "💖 Wishlisted" : "❤️ Wishlist"}
      </button>
    </div>
  );
}

export default function WishlistButton(props: WishlistButtonProps) {
  return (
    <Suspense fallback={<button className={props.className} disabled>Loading...</button>}>
      <WishlistButtonInner {...props} />
    </Suspense>
  );
}


