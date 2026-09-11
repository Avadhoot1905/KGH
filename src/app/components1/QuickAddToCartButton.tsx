"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartWishlist } from "@/app/context/CartWishlistContext";
import { FaShoppingCart, FaPlus, FaMinus } from "react-icons/fa";

type QuickAddToCartButtonProps = {
  productId: string;
  licenseRequired?: boolean;
  productQuantity?: number;
};

function QuickAddToCartInner({ productId, licenseRequired, productQuantity }: QuickAddToCartButtonProps) {
  const { getCartQuantity, updateCartQuantity, loading } = useCartWishlist();
  const { status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const quantity = getCartQuantity(productId);

  const handleQuantityChange = async (e: React.MouseEvent, delta: number) => {
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

    if (typeof productQuantity === "number" && delta > 0 && quantity >= productQuantity) {
      return;
    }

    try {
      await updateCartQuantity(productId, delta);
    } catch {
      // Quiet fail without alert popup or crashing
    }
  };

  if (typeof productQuantity === "number" && productQuantity <= 0) {
    return (
      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-800">
        Out of Stock
      </span>
    );
  }

  if (licenseRequired) {
    return (
      <span 
        className="text-[10px] uppercase tracking-wider font-semibold text-red-500 bg-red-950/30 px-2 py-1 rounded border border-red-900/50"
        title="Valid license required depending on item."
      >
        License Req.
      </span>
    );
  }

  if (loading) {
    return (
      <button className="quick-cart-btn loading" disabled>
        <FaShoppingCart className="animate-pulse" />
      </button>
    );
  }

  if (quantity === 0) {
    return (
      <button
        onClick={(e) => handleQuantityChange(e, 1)}
        className="quick-cart-btn"
        title="Add to Cart"
      >
        <FaShoppingCart />
      </button>
    );
  }

  const isMaxStockReached = typeof productQuantity === "number" && quantity >= productQuantity;

  return (
    <div className="quick-cart-controls" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <button
        onClick={(e) => handleQuantityChange(e, -1)}
        className="quick-cart-control-btn"
      >
        <FaMinus size={10} />
      </button>
      <span className="quick-cart-qty">{quantity}</span>
      <button
        onClick={(e) => handleQuantityChange(e, 1)}
        disabled={isMaxStockReached}
        className={`quick-cart-control-btn ${isMaxStockReached ? "opacity-30 cursor-not-allowed" : ""}`}
        title={isMaxStockReached ? `Maximum available stock reached (${productQuantity})` : "Increase quantity"}
      >
        <FaPlus size={10} />
      </button>
    </div>
  );
}

export default function QuickAddToCartButton(props: QuickAddToCartButtonProps) {
  return (
    <Suspense fallback={<button className="quick-cart-btn loading" disabled><FaShoppingCart className="animate-pulse" /></button>}>
      <QuickAddToCartInner {...props} />
    </Suspense>
  );
}
