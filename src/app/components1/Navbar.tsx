"use client";

import Link from 'next/link';
import { FaShoppingCart, FaUser, FaHeart } from 'react-icons/fa';
import './Navbar.css';
import SearchBar from './SearchBar';
import ProtectedLink from './ProtectedLink';

export default function Navbar() {
  return (
    <header className="navbar">
      {/* Logo */}
      <Link href="/">
        <div className="logo">KATHURIA GUN HOUSE</div>
      </Link>

      {/* Icons + Search */}
      <div className="nav-icons" style={{ gap: 8 }}>
        <div style={{ minWidth: 280 }}>
          <SearchBar />
        </div>

        {/* Wishlist Heart */}
        <div className="wishlist-icon">
          <ProtectedLink 
            href="/Wishlist" 
            title="Wishlist"
            authTitle="Sign in to view your wishlist"
            authMessage="Save your favorite items by signing in with Google."
          >
            <FaHeart className="icon" title="Wishlist" />
          </ProtectedLink>
          {/* <span className="wishlist-count">5</span>*/}
        </div>

        {/* Cart */}
        <div className="cart-icon">
          <ProtectedLink 
            href="/Cart" 
            title="Cart"
            authTitle="Sign in to view your cart"
            authMessage="Start shopping and save items to your cart by signing in."
          >
            <FaShoppingCart className="icon" title="Cart" />
          </ProtectedLink>
       {/*   <span className="cart-count">2</span>*/}
        </div>

        <ProtectedLink 
          href="/profile" 
          title="Profile"
          authTitle="Sign in to view your profile"
          authMessage="Access your orders, wishlist, and account settings by signing in."
        >
          <FaUser className="icon" title="Profile" />
        </ProtectedLink>
      </div>
    </header>
  );
}
