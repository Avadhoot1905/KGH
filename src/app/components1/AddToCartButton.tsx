"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { getCartQuantityForProduct, updateProductQuantityInCart } from "@/actions/cart";

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
  className?: string;
  licenseRequired?: boolean;
  productQuantity?: number;
};

// Reusable animated target/crosshair spinner matching the shooting theme
function TargetLoader({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className} text-current`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" className="opacity-25" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function AddToCartButtonInner({ productId, disabled, className = "red", licenseRequired, productQuantity }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    async function loadQuantity() {
      try {
        const result = await getCartQuantityForProduct(productId);
        if (!ignore) {
          setQuantity(result.quantity ?? 0);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadQuantity();
    return () => {
      ignore = true;
    };
  }, [productId]);

  const handleQuantityChange = async (delta: number) => {
    if (disabled || updating) return;

    const auth = await getAuthState();
    if (!auth.isAuthenticated) {
      const current = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      const url = new URL(window.location.href);
      url.searchParams.set("authRequired", "1");
      url.searchParams.set("redirect", current);
      router.replace(url.pathname + "?" + url.searchParams.toString());
      return;
    }

    setUpdating(true);
    try {
      const result = await updateProductQuantityInCart(productId, delta);
      setQuantity(result.quantity ?? 0);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update cart");
    } finally {
      setUpdating(false);
    }
  };

  if (typeof productQuantity === "number" && productQuantity <= 0) {
    return (
      <button className={`${className} opacity-50 cursor-not-allowed`} disabled style={{ padding: "8px 16px", borderRadius: "4px" }}>
        Out of Stock
      </button>
    );
  }

  if (licenseRequired) {
    return (
      <span className="text-xs uppercase tracking-wider font-semibold text-red-500 bg-red-950/30 px-2.5 py-1 rounded border border-red-900/50">
        License Required
      </span>
    );
  }

  if (loading) {
    return (
      <button className={`${className} flex items-center justify-center gap-1.5`} disabled style={{ padding: "8px 16px", borderRadius: "4px", opacity: 0.7 }}>
        <TargetLoader />
        <span>Loading...</span>
      </button>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => handleQuantityChange(1)}
        disabled={disabled || updating}
        className={`${className} flex items-center justify-center gap-1.5`}
        style={{ padding: "8px 16px", borderRadius: "4px", fontWeight: "bold" }}
      >
        {updating ? (
          <>
            <TargetLoader />
            <span>Adding...</span>
          </>
        ) : (
          "Add to Cart"
        )}
      </button>
    );
  }

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button
        type="button"
        onClick={() => handleQuantityChange(-1)}
        disabled={disabled || updating || quantity <= 0}
        className={className}
        style={{ minWidth: 38, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        −
      </button>
      <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {updating ? <TargetLoader /> : quantity}
      </span>
      <button
        type="button"
        onClick={() => handleQuantityChange(1)}
        disabled={disabled || updating}
        className={className}
        style={{ minWidth: 38, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        +
      </button>
    </div>
  );
}

export default function AddToCartButton(props: AddToCartButtonProps) {
  return (
    <Suspense fallback={
      <button className={`${props.className} flex items-center justify-center gap-1.5`} disabled style={{ padding: "8px 16px", borderRadius: "4px", opacity: 0.7 }}>
        <TargetLoader />
        <span>Loading...</span>
      </button>
    }>
      <AddToCartButtonInner {...props} />
    </Suspense>
  );
}
