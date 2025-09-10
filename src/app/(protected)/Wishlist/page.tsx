"use client";
import React, { useState } from "react";
import Navbar from "@/app/components1/Navbar";
import Footer from "@/app/components1/Footer";
import "./wishlist.css";

interface WishlistItem {
  id: number;
  name: string;
  price: string;
  tag?: string;
  license: boolean;
  img: string;
}

interface Recommendation {
  id: number;
  name: string;
  price: string;
  img: string;
}

export default function WishlistPage() {
  const [wishlist] = useState<WishlistItem[]>([
    {
      id: 1,
      name: "Glock 17 Gen 5 - 9mm",
      price: "₹85,000",
      tag: "NEW",
      license: true,
      img: "/guns/glock17.jpg",
    },
    {
      id: 2,
      name: "AR-15 Tactical Rifle",
      price: "₹1,25,000",
      tag: "TOP SELLER",
      license: true,
      img: "/guns/ar15.jpg",
    },
    {
      id: 3,
      name: "Tactical Bulletproof Vest",
      price: "₹45,000",
      license: false,
      img: "/accessories/vest.jpg",
    },
    {
      id: 4,
      name: "Tactical Rifle Scope 4×32",
      price: "₹15,000",
      license: true,
      img: "/accessories/scope.jpg",
    },
    {
      id: 5,
      name: "9mm Ammunition (50 Rounds)",
      price: "₹2,500",
      tag: "LIMITED",
      license: true,
      img: "/ammo/9mm.jpg",
    },
  ]);

  const recommendations: Recommendation[] = [
    { id: 1, name: "Combat Knife", price: "₹7,500", img: "/recs/knife.jpg" },
    { id: 2, name: "Tactical Holster", price: "₹5,000", img: "/recs/holster.jpg" },
    { id: 3, name: "Night Vision", price: "₹75,000", img: "/recs/nightvision.jpg" },
    { id: 4, name: "Tactical Gloves", price: "₹2,000", img: "/recs/gloves.jpg" },
    { id: 5, name: "Tactical Backpack", price: "₹6,000", img: "/recs/backpack.jpg" },
    { id: 6, name: "Tactical Helmet", price: "₹10,000", img: "/recs/helmet.jpg" },
  ];

  return (
    <div>
      <Navbar />
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h2>Your Wishlist</h2>
          <button className="btn-red">Move All to Cart</button>
        </div>

        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div key={item.id} className="wishlist-card">
              <img src={item.img} alt={item.name} className="wishlist-img" />
              {item.tag && <span className="wishlist-tag">{item.tag}</span>}
              <h3 className="wishlist-title">{item.name}</h3>
              <p className="wishlist-price">{item.price}</p>
              {item.license && (
                <p className="wishlist-license">🔒 License Required</p>
              )}
              <div className="wishlist-actions">
                <button className="btn-red">Move to Cart</button>
                <button className="btn-grey">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="recommendations">
          <h3>You Might Also Like</h3>
          <div className="recommend-grid">
            {recommendations.map((rec) => (
              <div key={rec.id} className="recommend-card">
                <img src={rec.img} alt={rec.name} className="recommend-img" />
                <h4>{rec.name}</h4>
                <p>{rec.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
