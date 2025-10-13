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
    <div>
        <Navbar/>
    
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


        {/* Buttons */}
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
        {/* Navbar */}
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

        {/* Conditional Rendering for Section */}
        {activeSection === "orders" && (
          <div className="bg-[#111] p-5 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Your Orders</h3>

            {/* Tabs */}
            <div className="flex gap-3 mb-4">
              {["all", "delivered", "pending"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1 rounded-lg text-sm capitalize ${
                    activeTab === tab
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <Image
                    src="/rifle.png"
                    alt="AR-15"
                    width={60}
                    height={60}
                    className="rounded-md bg-gray-800 p-1"
                  />
                  <div>
                    <p className="font-semibold">AR-15 Tactical Rifle</p>
                    <p className="text-sm text-gray-400">
                      Order #KGH-2024-001 • Delivered on Dec 15, 2024
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">$1,299.99</p>
                  <button className="mt-2 bg-red-600 hover:bg-red-700 text-sm px-3 py-1 rounded-lg font-medium">
                    Reorder
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <Image
                    src="/glock.png"
                    alt="Glock 19"
                    width={60}
                    height={60}
                    className="rounded-md bg-gray-800 p-1"
                  />
                  <div>
                    <p className="font-semibold">Glock 19 Gen 5</p>
                    <p className="text-sm text-gray-400">
                      Order #KGH-2024-002 •{" "}
                      <span className="text-yellow-400">In Transit</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">$549.99</p>
                  <button className="mt-2 bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1 rounded-lg font-medium">
                    Track Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Returns Section */}
        {activeSection === "returns" && (
          <div className="bg-[#111] p-5 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Your Returns</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <Image
                    src="/headphones.png"
                    alt="Headphones"
                    width={60}
                    height={60}
                    className="rounded-md bg-gray-800 p-1"
                  />
                  <div>
                    <p className="font-semibold">Noise Cancelling Headphones</p>
                    <p className="text-sm text-gray-400">
                      Return #RTN-2024-103 • Completed on Sep 22, 2024
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">Refunded</p>
                  <p className="text-gray-400 text-sm">$249.99</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <Image
                    src="/scope.png"
                    alt="Rifle Scope"
                    width={60}
                    height={60}
                    className="rounded-md bg-gray-800 p-1"
                  />
                  <div>
                    <p className="font-semibold">Precision Rifle Scope</p>
                    <p className="text-sm text-gray-400">
                      Return #RTN-2024-108 •{" "}
                      <span className="text-yellow-400">In Process</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">$329.99</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Redirect Section */}
        {activeSection === "wishlist" && (
          <div className="bg-[#111] p-5 rounded-lg border border-gray-800 text-center">
            <h3 className="text-lg font-semibold mb-3">Your Wishlist</h3>
            <p className="text-gray-400 mb-4">
              View and manage your saved items on the Wishlist page.
            </p>
            <Link
              href="/Wishlist"
              className="inline-block bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Wishlist
            </Link>
          </div>
        )}
      </main>
    </div>
<Footer/>
    </div>

  );
}
