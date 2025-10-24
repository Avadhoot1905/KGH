"use client";

import { useState, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { addToCart } from "@/actions/cart";

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
  className?: string;
};

function AddToCartButtonInner({ productId, disabled, className = "red" }: AddToCartButtonProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleAdd = async () => {
    if (disabled || adding) return;
    
    const auth = await getAuthState();
    if (!auth.isAuthenticated) {
      const current = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      const url = new URL(window.location.href);
      url.searchParams.set("authRequired", "1");
      url.searchParams.set("redirect", current);
      router.replace(url.pathname + "?" + url.searchParams.toString());
      return;
    }
    setAdding(true);
    try {
      await addToCart(productId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button className={className} onClick={handleAdd} disabled={disabled || adding}>
        {adding ? "ADDING..." : added ? "ADDED" : "ADD TO CART"}
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


