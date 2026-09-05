"use client";

import { useState, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartWishlist } from "@/app/context/CartWishlistContext";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";

type WishlistButtonProps = {
  productId: string;
  isWishlisted?: boolean;
  className?: string;
};

function WishlistButtonInner({ productId }: WishlistButtonProps) {
  const { isWishlisted: checkIsWishlisted, toggleWishlist, loading } = useCartWishlist();
  const { status } = useSession();
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const wishlisted = checkIsWishlisted(productId);

  const onToggleWishlist = async () => {
    if (status !== "authenticated") {
      const current = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      const url = new URL(window.location.href);
      url.searchParams.set("authRequired", "1");
      url.searchParams.set("redirect", current);
      router.replace(url.pathname + "?" + url.searchParams.toString());
      return;
    }

    setSaving(true);
    try {
      await toggleWishlist(productId);
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button 
      className={`wishlist-detail-btn ${wishlisted ? "active" : ""} ${saving ? "saving" : ""}`} 
      onClick={onToggleWishlist} 
      aria-pressed={wishlisted}
      disabled={loading}
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


