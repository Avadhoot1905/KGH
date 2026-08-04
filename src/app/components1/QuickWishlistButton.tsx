"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { toggleWishlist as toggleWishlistAction, getMyWishlistItems, WishlistListItem } from "@/actions/wishlist";
import { FaHeart, FaRegHeart } from "react-icons/fa";

type QuickWishlistButtonProps = {
  productId: string;
};

function QuickWishlistInner({ productId }: QuickWishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    async function checkWishlist() {
      try {
        const auth = await getAuthState();
        if (auth.isAuthenticated) {
          const items = await getMyWishlistItems();
          const isItemWishlisted = items.some((item: WishlistListItem) => item.id === productId);
          if (!ignore) {
            setWishlisted(isItemWishlisted);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    checkWishlist();
    return () => {
      ignore = true;
    };
  }, [productId]);

  const onToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (loading) {
    return (
      <button className="quick-wishlist-btn loading" disabled>
        <FaRegHeart className="text-gray-500" />
      </button>
    );
  }

  return (
    <button 
      className={`quick-wishlist-btn ${wishlisted ? "active" : ""}`} 
      onClick={onToggleWishlist}
      title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      {wishlisted ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
    </button>
  );
}

export default function QuickWishlistButton(props: QuickWishlistButtonProps) {
  return (
    <Suspense fallback={<button className="quick-wishlist-btn loading" disabled><FaRegHeart className="text-gray-500" /></button>}>
      <QuickWishlistInner {...props} />
    </Suspense>
  );
}
