"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { getCartQuantityForProduct, updateProductQuantityInCart } from "@/actions/cart";

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
  className?: string;
};

function AddToCartButtonInner({ productId, disabled, className = "red" }: AddToCartButtonProps) {
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
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button
        type="button"
        onClick={() => handleQuantityChange(-1)}
        disabled={disabled || updating || quantity <= 0}
        className={className}
        style={{ minWidth: 38, padding: "8px 10px" }}
      >
        −
      </button>
      <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
        {loading ? "…" : updating ? "…" : quantity}
      </span>
      <button
        type="button"
        onClick={() => handleQuantityChange(1)}
        disabled={disabled || updating}
        className={className}
        style={{ minWidth: 38, padding: "8px 10px" }}
      >
        +
      </button>
    </div>
  );
}

export default function AddToCartButton(props: AddToCartButtonProps) {
  return (
    <Suspense fallback={<button className={props.className} disabled>Loading...</button>}>
      <AddToCartButtonInner {...props} />
    </Suspense>
  );
}


