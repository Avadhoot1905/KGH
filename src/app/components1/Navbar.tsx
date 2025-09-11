"use client";
import Link from 'next/link';
import { FaSearch, FaShoppingCart, FaUser, FaHeart } from 'react-icons/fa';
import './Navbar.css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  return (
    <header className="navbar">
      {/* Logo */}
      <Link href="/">
        <div className="logo">KATHURIA GUN HOUSE</div>
      </Link>

      {/* Links */}
      <nav className="nav-links">
        <Link href="#">HANDGUNS</Link>
        <Link href="#">RIFLES</Link>
        <Link href="#">AMMUNITION</Link>
        <Link href="#">ACCESSORIES</Link>
      </nav>

      {/* Icons */}
      <div className="nav-icons">
        <input
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <FaSearch
          className="icon"
          title="Search"
          onClick={() => {
            const q = query.trim();
            if (!q) return;
            const params = new URLSearchParams({ q });
            router.push(`/Shop?${params.toString()}`);
          }}
        />

        {/* Wishlist Heart */}
        <div className="wishlist-icon">
          <Link href="/Wishlist">
            <FaHeart className="icon" title="Wishlist" />
          </Link>
          <span className="wishlist-count">5</span>
        </div>

        {/* Cart */}
        <div className="cart-icon">
          <Link href="/Cart">
            <FaShoppingCart className="icon" title="Cart" />
          </Link>
          <span className="cart-count">2</span>
        </div>

        <Link href="/profile">
          <FaUser className="icon" title="Profile" />
        </Link>
      </div>
    </header>
  );
}
