"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, RotateCcw, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Navbar from "@/app/components1/Navbar";
import Footer from "@/app/components1/Footer";
import { getCurrentUser, type CurrentUser } from "@/actions/auth";
import { getAllOrders, updateUserProfile, changePassword, type OrderListItem } from "@/actions/profile";
import { getMyWishlistItems, type WishlistListItem } from "@/actions/wishlist";

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<"orders" | "returns" | "wishlist">("orders");
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phoneNumber: "", contact: "" });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        if (userData) {
          setEditForm({
            name: userData.name || "",
            phoneNumber: userData.phoneNumber || "",
            contact: userData.contact || "",
          });
        }

        const ordersData = await getAllOrders();
        setOrders(ordersData);

        const wishlistData = await getMyWishlistItems();
        setWishlistItems(wishlistData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getFilteredOrders = () => {
    if (activeTab === "all") return orders;
    if (activeTab === "delivered") return orders.filter(order => order.status === "COMPLETED");
    if (activeTab === "pending") return orders.filter(order => order.status === "PENDING");
    return orders;
  };

  return (
    <div>
        <Navbar/>
    
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#111] p-6 flex flex-col items-center border-r border-gray-800">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-600 mb-4">
          {user?.image ? (
            <Image
              src={user.image}
              alt="User Avatar"
              width={96}
              height={96}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
        
        {editMode ? (
          <div className="w-full space-y-3 mb-4">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full Name"
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-600 focus:outline-none"
            />
            <input
              type="text"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="Phone Number"
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-600 focus:outline-none"
            />
            <input
              type="text"
              value={editForm.contact}
              onChange={(e) => setEditForm(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="Contact Info"
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-red-600 focus:outline-none"
            />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-center">{user?.name || "User"}</h2>
            <p className="text-gray-400 text-sm mb-2 text-center">{user?.email}</p>
            {user?.phoneNumber && (
              <p className="text-gray-400 text-sm text-center">{user.phoneNumber}</p>
            )}
            <p className="text-gray-400 text-sm mb-6 text-center">
              Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently"}
            </p>
          </>
        )}

        {/* Buttons */}
        <div className="mt-6 w-full space-y-3">
        {/*  <button 
            onClick={handleEditProfile}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-medium"
          >
            <Edit size={16} /> {editMode ? "Save Profile" : "Edit Profile"}
          </button>
          {editMode && (
            <button 
              onClick={() => setEditMode(false)}
              className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleChangePassword}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg font-medium"
          >
            <Lock size={16} /> Change Password
          </button>*/}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg font-medium"
          >
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
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-400">Loading orders...</p>
              </div>
            ) : getFilteredOrders().length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No orders found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredOrders().map((order) => (
                  <div key={order.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Order #{order.id}</h4>
                      <div className="text-right">
                        <p className="text-lg font-bold">{order.total}</p>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            order.status === "COMPLETED"
                              ? "bg-green-600 text-white"
                              : order.status === "PENDING"
                              ? "bg-yellow-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {order.status === "COMPLETED" ? "Delivered" : order.status === "PENDING" ? "In Transit" : "Cancelled"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <Image
                            src={item.product.photos[0]?.url || "/next.svg"}
                            alt={item.product.name}
                            width={60}
                            height={60}
                            className="rounded-md bg-gray-800 p-1"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{item.product.name}</p>
                            <p className="text-sm text-gray-400">
                              Quantity: {item.quantity} • Ordered on {order.createdAt}
                            </p>
                          </div>
                          <div className="text-right">
                            {order.status === "COMPLETED" ? (
                              <button className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1 rounded-lg font-medium">
                                Reorder
                              </button>
                            ) : order.status === "PENDING" ? (
                              <button className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1 rounded-lg font-medium">
                                Track Order
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Returns Section */}
        {activeSection === "returns" && (
          <div className="bg-[#111] p-5 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Your Returns & Cancelled Orders</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-400">Loading returns...</p>
              </div>
            ) : orders.filter(order => order.status === "CANCELLED").length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No returns or cancelled orders found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.filter(order => order.status === "CANCELLED").map((order) => (
                  <div key={order.id} className="bg-gray-900 rounded-lg p-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between mb-3 last:mb-0">
                        <div className="flex items-center gap-4">
                          <Image
                            src={item.product.photos[0]?.url || "/next.svg"}
                            alt={item.product.name}
                            width={60}
                            height={60}
                            className="rounded-md bg-gray-800 p-1"
                          />
                          <div>
                            <p className="font-semibold">{item.product.name}</p>
                            <p className="text-sm text-gray-400">
                              Order #{order.id} • Cancelled on {order.updatedAt}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-red-600 text-white text-sm px-2 py-1 rounded-full">
                            Cancelled
                          </span>
                          <p className="text-gray-400 text-sm mt-1">₹{Math.round(item.price * item.quantity).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist Section */}
        {activeSection === "wishlist" && (
          <div className="bg-[#111] p-5 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Wishlist</h3>
              <Link
                href="/Wishlist"
                className="text-red-500 hover:text-red-400 text-sm font-medium"
              >
                View Full Wishlist →
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-400">Loading wishlist...</p>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-8">
                <Heart size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 mb-4">Your wishlist is empty.</p>
                <Link
                  href="/Shop"
                  className="inline-block bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                    <div className="relative aspect-square mb-3">
                      <Image
                        src={item.img}
                        alt={item.name}
                        fill
                        className="object-cover rounded-md"
                      />
                      {item.tag && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1 truncate">{item.name}</h4>
                    <p className="text-red-500 font-bold mb-2">{item.price}</p>
                    {item.license && (
                      <p className="text-xs text-yellow-500 mb-2">⚠️ License Required</p>
                    )}
                    <Link
                      href={`/ProductDetail/${item.id}`}
                      className="block w-full bg-red-600 hover:bg-red-700 text-center py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {wishlistItems.length > 6 && (
              <div className="text-center mt-6">
                <Link
                  href="/Wishlist"
                  className="inline-block bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  View All {wishlistItems.length} Items
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
<Footer/>
    </div>

  );
}
