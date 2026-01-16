"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/app/components1/Navbar";
import Footer from "@/app/components1/Footer";
import "./wishlist.css";
import { getMyWishlistItems, moveWishlistItemToCart, removeFromMyWishlist, moveAllWishlistToCart, getWishlistRecommendations } from "@/actions/wishlist";
import Link from "next/link";
import Image from "next/image";

interface WishlistItem {
  id: string;
  name: string;
  price: string;
  tag?: string;
  license: boolean;
  img: string;
}

interface Recommendation {
  id: string;
  name: string;
  price: string;
  img: string;
  brand: string;
  type: string;
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  function formatPrice(price: string | number) {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
    if (typeof price === 'number') return formatter.format(price);
    const trimmed = (price || "").toString().trim();
    if (trimmed.startsWith("$")) {
      const num = parseFloat(trimmed.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(num)) return formatter.format(num);
      return trimmed.replace(/^\$\s?/, '₹');
    }
    const numeric = parseFloat(trimmed.replace(/[^0-9.-]+/g, ""));
    if (!isNaN(numeric)) return formatter.format(numeric);
    return trimmed.replace(/\$/g, '₹');
  }

  const loadData = async () => {
    try {
      const [items, recs] = await Promise.all([
        getMyWishlistItems(),
        getWishlistRecommendations(),
      ]);
      setWishlist(items as unknown as WishlistItem[]);
      setRecommendations(recs as unknown as Recommendation[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await loadData();
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <Navbar />
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h2>Your Wishlist</h2>
          <button
            className="btn-red"
            onClick={async () => {
              await moveAllWishlistToCart();
              setWishlist([]);
              setRecommendations([]);
            }}
          >
            Move All to Cart
          </button>
        </div>

        <div className="wishlist-grid">
          {loading ? (
            <></>
          ) : wishlist.length === 0 ? (
            <div className="empty-state p-8 text-center text-gray-400 col-span-full">
              <p className="text-lg font-medium">No products added yet.</p>
              <p className="mt-2">Add your first product to your wishlist to get started.</p>
              <Link href="/Shop"><button className="btn-red mt-4">Start Shopping</button></Link>
            </div>
          ) : (
            wishlist.map((item) => (
              <div key={item.id} className="wishlist-card">
                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                  <Image src={item.img} alt={item.name} className="wishlist-img" fill style={{ objectFit: 'cover' }} />
                </div>
              {item.tag && <span className="wishlist-tag">{item.tag}</span>}
              <h3 className="wishlist-title">{item.name}</h3>
              <p className="wishlist-price">{formatPrice(item.price)}</p>
              {item.license && (
                <p className="wishlist-license">🔒 License Required</p>
              )}
              <div className="wishlist-actions">
                <button
                  className="btn-red"
                  onClick={async () => {
                    await moveWishlistItemToCart(String(item.id));
                    setWishlist((prev) => prev.filter((w) => w.id !== item.id));
                    // Refresh recommendations
                    const recs = await getWishlistRecommendations();
                    setRecommendations(recs as unknown as Recommendation[]);
                  }}
                >
                  Move to Cart
                </button>
                <button
                  className="btn-grey"
                  onClick={async () => {
                    await removeFromMyWishlist(String(item.id));
                    setWishlist((prev) => prev.filter((w) => w.id !== item.id));
                    // Refresh recommendations
                    const recs = await getWishlistRecommendations();
                    setRecommendations(recs as unknown as Recommendation[]);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="recommendations">
            <h3>You Might Also Like</h3>
            <div className="recommend-grid">
              {recommendations.map((rec) => (
                <Link href={`/ProductDetail/${rec.id}`} key={rec.id} style={{ textDecoration: 'none' }}>
                  <div className="recommend-card">
                    <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                      <Image src={rec.img} alt={rec.name} className="recommend-img" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <h4>{rec.name}</h4>
                    <p className="recommend-meta">{rec.brand} • {rec.type}</p>
                    <p className="recommend-price">{formatPrice(rec.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
