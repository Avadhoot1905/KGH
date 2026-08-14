"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaStore,
  FaHome,
  FaCalendarAlt,
  FaHeadset,
} from "react-icons/fa";
import SearchBar from "./SearchBar";
import ProtectedLink from "./ProtectedLink";
import AuthPopup from "./AuthPopup";
import FeedbackPopup from "./FeedbackPopup";
import AppointmentPopup from "./AppointmentPopup";
import { getMyCartItems } from "@/actions/cart";

export default function Navbar() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    if (!session?.user) {
      setCartCount(0);
      return;
    }
    let ignore = false;
    async function loadCartCount() {
      try {
        const items = await getMyCartItems();
        if (!ignore) {
          const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(totalQty);
        }
      } catch {
        // silent fail
      }
    }
    loadCartCount();
    return () => { ignore = true; };
  }, [session?.user]);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

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

          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>

        {/* BOOK APPOINTMENT */}
        <div className="relative">
          <button
            onClick={() => {
              if (session?.user) {
                setIsAppointmentOpen(true);
              } else {
                setShowAuthPopup(true);
              }
            }}
            title="Book Appointment"
            className="focus:outline-none flex items-center"
          >
            <FaCalendarAlt className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
          </button>
        </div>

        {/* COMPLAINTS */}
        <div className="relative">
          <button
            onClick={() => {
              if (session?.user) {
                setIsComplaintOpen(true);
              } else {
                setShowAuthPopup(true);
              }
            }}
            title="Give feedback / File a Complaint"
            className="focus:outline-none flex items-center"
          >
            <FaHeadset className="text-xl md:text-lg cursor-pointer hover:text-[#b5333c] transition" />
          </button>
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

        {/* ADMIN PANEL (Only visible to authenticated users with ADMIN role) */}
        {session?.user && (session.user as { role?: string }).role === "ADMIN" && (
          <Link href="/mod" title="Admin Panel">
            <span className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2 py-1 rounded transition cursor-pointer">
              ADMIN
            </span>
          </Link>
        )}
      </div>

      {isAppointmentOpen && (
        <AppointmentPopup onClose={() => setIsAppointmentOpen(false)} />
      )}
      {isComplaintOpen && (
        <FeedbackPopup onClose={() => setIsComplaintOpen(false)} initialType="COMPLAINT" />
      )}
      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        callbackUrl={typeof window !== "undefined" ? window.location.pathname : "/"}
        title="Sign in to file a complaint"
        message="Please sign in with Google to file a complaint or report an issue."
      />
    </header>
  );
}
