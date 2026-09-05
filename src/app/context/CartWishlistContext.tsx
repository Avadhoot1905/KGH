"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { getWishlistProductIds, toggleWishlist as toggleWishlistAction } from "@/actions/wishlist";
import { getCartQuantitiesMap, updateProductQuantityInCart } from "@/actions/cart";

interface CartWishlistContextType {
  wishlistIds: Set<string>;
  cartQuantities: Record<string, number>;
  cartCount: number;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  getCartQuantity: (productId: string) => number;
  updateCartQuantity: (productId: string, delta: number) => Promise<number>;
  refreshCartAndWishlist: () => Promise<void>;
}

const CartWishlistContext = createContext<CartWishlistContextType | null>(null);

export function CartWishlistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBatchData = useCallback(async () => {
    if (status !== "authenticated") {
      setWishlistIds(new Set());
      setCartQuantities({});
      setLoading(false);
      return;
    }

    try {
      const [wIds, cMap] = await Promise.all([
        getWishlistProductIds(),
        getCartQuantitiesMap(),
      ]);
      setWishlistIds(new Set(wIds));
      setCartQuantities(cMap);
    } catch (error) {
      console.error("Failed to load wishlist/cart batch data:", error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!productId) return false;

      const currentlyWishlisted = wishlistIds.has(productId);
      const nextWishlisted = !currentlyWishlisted;

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (nextWishlisted) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });

      try {
        const res = await toggleWishlistAction(productId);
        return res.wishlisted;
      } catch (err) {
        // Revert optimistic update on error
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (currentlyWishlisted) {
            next.add(productId);
          } else {
            next.delete(productId);
          }
          return next;
        });
        throw err;
      }
    },
    [wishlistIds]
  );

  const getCartQuantity = useCallback(
    (productId: string) => cartQuantities[productId] ?? 0,
    [cartQuantities]
  );

  const updateCartQuantity = useCallback(
    async (productId: string, delta: number): Promise<number> => {
      if (!productId) return 0;

      const currentQty = cartQuantities[productId] ?? 0;
      const nextQty = Math.max(0, currentQty + delta);

      // Optimistic update
      setCartQuantities((prev) => {
        const next = { ...prev };
        if (nextQty <= 0) {
          delete next[productId];
        } else {
          next[productId] = nextQty;
        }
        return next;
      });

      try {
        const res = await updateProductQuantityInCart(productId, delta);
        const actualQty = res.quantity ?? 0;
        setCartQuantities((prev) => {
          const next = { ...prev };
          if (actualQty <= 0) {
            delete next[productId];
          } else {
            next[productId] = actualQty;
          }
          return next;
        });
        return actualQty;
      } catch (err) {
        // Revert optimistic update on error
        setCartQuantities((prev) => {
          const next = { ...prev };
          if (currentQty <= 0) {
            delete next[productId];
          } else {
            next[productId] = currentQty;
          }
          return next;
        });
        throw err;
      }
    },
    [cartQuantities]
  );

  const cartCount = Object.values(cartQuantities).reduce((a, b) => a + b, 0);

  return (
    <CartWishlistContext.Provider
      value={{
        wishlistIds,
        cartQuantities,
        cartCount,
        loading,
        isWishlisted,
        toggleWishlist,
        getCartQuantity,
        updateCartQuantity,
        refreshCartAndWishlist: fetchBatchData,
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  );
}

export function useCartWishlist() {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error("useCartWishlist must be used within a CartWishlistProvider");
  }
  return context;
}
