"use client";
import { useState } from "react";
import Image from "next/image";
import { Settings, Heart, RotateCcw, LogOut, Lock, Edit } from "lucide-react";
import Link from "next/link";
import Navbar from "@/app/components1/Navbar";
import Footer from "@/app/components1/Footer";

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<"orders" | "returns" | "wishlist">("orders");
  const [activeTab, setActiveTab] = useState("all");

  return (
    <>
      {/* ✅ Global Navbar */}
      <Navbar />

      {/* ✅ Main Profile Content */}
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar */}
        <aside className="w-72 bg-[#111] p-6 flex flex-col items-center border-r border-gray-800">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-600 mb-4">
            <Image
              src="/profile.jpg"
              alt="User Avatar"
              width={96}
              height={96}
              className="object-cover"
            />
          </div>
          <h2 className="text-lg font-semibold">John Anderson</h2>
          <p className="text-gray-400 text-sm mb-6">Joined: April 2024</p>

          {/* Sidebar Buttons */}
          <div className="mt-6 w-full space-y-3">
            <button className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-medium">
              <Edit size={16} /> Edit Profile
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg font-medium">
              <Lock size={16} /> Change Password
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg font-medium">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Top Section (Tabs) */}
          <div className="flex items-center justify-between mb-6 bg-[#111] p-3 rounded-lg border border-gray-800">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveSection("orders")}
                className={`pb-1 font-semibold ${
                  activeSection === "orders"
                    ? "text-red-500 border-b-2 border-red-600"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Your Orders
              </button>
              <button
                onClick={() => setActiveSection("returns")}
                className={`pb-1 flex items-center gap-1 font-semibold ${
                  activeSection === "returns"
                    ? "text-red-500 border-b-2 border-red-600"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <RotateCcw size={16} /> Returns
              </button>
              <button
                onClick={() => setActiveSection("wishlist")}
                className={`pb-1 flex items-center gap-1 font-semibold ${
                  activeSection === "wishlist"
                    ? "text-red-500 border-b-2 border-red-600"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Heart size={16} /> Wishlist
              </button>
            </div>
          </div>

          {/* Conditional Rendering for Each Section */}
          {/* ... your Orders, Returns, and Wishlist sections stay as-is ... */}
        </main>
      </div>

      {/* ✅ Global Footer */}
      <Footer />
    </>
  );
}
