"use client";

import Link from "next/link";
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaStore,
  FaHome,
  FaCalendarAlt,
} from "react-icons/fa";
import SearchBar from "./SearchBar";
import ProtectedLink from "./ProtectedLink";

export default function Navbar() {
  return (
    <header
      className="
        bg-black text-white
        flex flex-col md:flex-row
        md:items-center md:justify-between
        px-4 md:px-8 py-4
        gap-4
      "
    >
      {/* LOGO */}
      <Link href="/" className="w-full md:w-auto text-center md:text-left">
        <div className="font-bold text-sm md:text-lg tracking-widest">
          KATHURIA GUN HOUSE
        </div>
      </Link>

      {/* SEARCH + ICONS */}
      <div
        className="
          flex flex-wrap items-center justify-center md:justify-end
          gap-4 md:gap-6
          w-full md:w-auto
        "
      >
        {/* SEARCH BAR */}
        <div className="w-full md:w-[280px]">
          <SearchBar />
        </div>
        
        {/* HOME */}
<div className="relative">
  <Link href="/" title="Home">
    <FaHome className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
  </Link>
</div>

        {/* SHOP */}
        <div className="relative">
          <ProtectedLink
            href="/Shop"
            title="Shop"
            authTitle="Sign in to view products"
            authMessage="Start shopping and save items to your cart by signing in."
          >
            <FaStore className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
          </ProtectedLink>
        </div>

        {/* WISHLIST */}
        <div className="relative">
          <ProtectedLink
            href="/Wishlist"
            title="Wishlist"
            authTitle="Sign in to view your wishlist"
            authMessage="Save your favorite items by signing in with Google."
          >
            <FaHeart className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
          </ProtectedLink>

          {/* Badge (optional)
          <span className="absolute -top-2 -right-2 bg-red-600 text-xs px-1.5 rounded-full">
            5
          </span>
          */}
        </div>

        {/* CART */}
        <div className="relative">
          <ProtectedLink
            href="/Cart"
            title="Cart"
            authTitle="Sign in to view your cart"
            authMessage="Start shopping and save items to your cart by signing in."
          >
            <FaShoppingCart className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
          </ProtectedLink>

          

        </div>
{/* BOOK APPOINTMENT */}
<div className="relative">
  <ProtectedLink
    href="/appointment"
    title="Book Appointment"
    authTitle="Sign in to book an appointment"
    authMessage="Please sign in with Google to book an appointment."
  >
    <FaCalendarAlt className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
  </ProtectedLink>
</div>
        {/* PROFILE */}
        <ProtectedLink
          href="/profile"
          title="Profile"
          authTitle="Sign in to view your profile"
          authMessage="Access your orders, wishlist, and account settings by signing in."
        >
          <FaUser className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
        </ProtectedLink>
      </div>
    </header>
  );
}
