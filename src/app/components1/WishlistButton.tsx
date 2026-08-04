"use client";

import { useState, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { toggleWishlist as toggleWishlistAction } from "@/actions/wishlist";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";

type WishlistButtonProps = {
  productId: string;
  isWishlisted?: boolean;
  className?: string;
};

function WishlistButtonInner({ productId, isWishlisted = false }: WishlistButtonProps) {
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
    <button 
      className={`wishlist-detail-btn ${wishlisted ? "active" : ""} ${saving ? "saving" : ""}`} 
      onClick={onToggleWishlist} 
      aria-pressed={wishlisted}
      disabled={saving}
    >
      {saving ? (
        <>
          <FaSpinner className="animate-spin" />
          <span>Saving...</span>
        </>
      ) : wishlisted ? (
        <>
          <FaHeart className="heart-icon active" />
          <span>Wishlisted</span>
        </>
      ) : (
        <>
          <FaRegHeart className="heart-icon" />
          <span>Add to Wishlist</span>
        </>
      )}
    </button>
  );
}

export default function WishlistButton(props: WishlistButtonProps) {
  return (
    <Suspense fallback={<button className="wishlist-detail-btn saving" disabled><FaSpinner className="animate-spin" /> <span>Loading...</span></button>}>
      <WishlistButtonInner {...props} />
    </Suspense>
  );
}


