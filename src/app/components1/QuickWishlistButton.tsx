"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartWishlist } from "@/app/context/CartWishlistContext";
import { FaHeart, FaRegHeart } from "react-icons/fa";

type QuickWishlistButtonProps = {
  productId: string;
};

function QuickWishlistInner({ productId }: QuickWishlistButtonProps) {
  const { isWishlisted, toggleWishlist, loading } = useCartWishlist();
  const { status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const wishlisted = isWishlisted(productId);

  const onToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated") {
      const current = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      const url = new URL(window.location.href);
      url.searchParams.set("authRequired", "1");
      url.searchParams.set("redirect", current);
      router.replace(url.pathname + "?" + url.searchParams.toString());
      return;
    }

    try {
      await toggleWishlist(productId);
    } catch (err) {
      console.error("Wishlist error:", err);
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
