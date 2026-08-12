"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, RotateCcw, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Navbar from "@/app/components1/Navbar";
import Footer from "@/app/components1/Footer";
import { getCurrentUser, type CurrentUser } from "@/actions/auth";
import { getAllOrders, type OrderListItem } from "@/actions/profile";
import { getMyWishlistItems, type WishlistListItem } from "@/actions/wishlist";
import { getOrderStatusLabel, isOrderSuccessful } from "@/lib/orderStatus";
import FinishProfileButton from "@/components/FinishProfileButton";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";

import { createReturnRequest } from "@/actions/feedbackAndReturns";

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<"orders" | "returns" | "wishlist">("orders");
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Return request states
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnPhotoBase64, setReturnPhotoBase64] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState(false);
  
  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
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

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getFilteredOrders = () => {
    if (activeTab === "all") return orders;
    if (activeTab === "delivered") return orders.filter(order => isOrderSuccessful(order.status));
    if (activeTab === "pending") return orders.filter(order => order.status === "PENDING" || order.status === "PAID");
    return orders;
  };

  const userPhone = user?.phoneNumber ?? user?.contact ?? null;
  const profileComplete = Boolean(user?.profileCompleted || (user?.name && userPhone && user?.addressLine1 && user?.city && user?.state && user?.country && user?.postalCode));

  const maskPhone = (value?: string | null) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 4) return `${digits.slice(0, 1)}***${digits.slice(-1)}`;
    const first = digits.slice(0, 1);
    const last = digits.slice(-3);
    const middle = "*".repeat(Math.max(3, digits.length - 4));
    return `${first}${middle}${last}`;
  };

  const maskedPhone = profileComplete ? maskPhone(userPhone) : null;

  const profileRows = [
    { label: "Name", value: user?.name },
    { label: "Email", value: user?.email },
    { label: "Phone", value: maskedPhone },
  ].filter((row) => row.value);

  return (
    <>
      <Navbar />
      <ProfileCompletionModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} onSaved={() => { setProfileModalOpen(false); void fetchData(); }} />
      <main className="min-h-screen bg-black text-white">
        <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
          <aside className="w-full lg:w-80 bg-[#111] p-6 rounded-3xl border border-gray-800 flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-600">
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

                <div className="mt-4 space-y-1">
                  <h2 className="text-xl font-semibold">{user?.name ?? "Guest User"}</h2>
                  {profileComplete && user?.email ? (
                    <p className="text-sm text-gray-400">{user.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-[#121212] border border-gray-800 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Complete your profile</p>
                    <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                      Add your name, phone number, address, and date of birth for a faster checkout experience.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white">
                    <Heart size={18} />
                  </div>
                </div>

                {profileComplete ? (
                  <div className="mt-6 space-y-3">
                    {profileRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-300">{row.label}</span>
                        <span className="text-sm font-medium text-white break-words">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400">
                      Your profile is incomplete. Tap below to add the missing details and unlock a smoother experience.
                    </p>
                    <div className="mt-5 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setProfileModalOpen(true)}
                        className="inline-flex w-full justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Complete your profile
                      </button>
                      <FinishProfileButton profileIncomplete={!profileComplete} onCompleted={() => setProfileModalOpen(false)} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-3 rounded-2xl font-medium"
              suppressHydrationWarning={true}
            >
              <LogOut size={16} /> Logout
            </button>
          </aside>

          <section className="flex-1 space-y-6">
            <div className="bg-[#111] p-4 rounded-3xl border border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveSection("orders")}
                    className={`pb-1 font-semibold ${
                      activeSection === "orders"
                        ? "text-red-500 border-b-2 border-red-600"
                        : "text-gray-400 hover:text-white"
                    }`}
                    suppressHydrationWarning={true}
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
                    suppressHydrationWarning={true}
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
                    suppressHydrationWarning={true}
                  >
                    <Heart size={16} /> Wishlist
                  </button>
                </div>
              </div>

              {activeSection === "orders" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Orders</h3>

                  <div className="flex flex-wrap gap-3 mb-4">
                    {["all", "delivered", "pending"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-2xl text-sm capitalize ${
                          activeTab === tab
                            ? "bg-red-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                        suppressHydrationWarning={true}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

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
                        <div key={order.id} className="bg-gray-900 rounded-3xl p-4 md:p-5">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                            <h4 className="font-semibold">Order #{order.id}</h4>
                            <div className="text-right">
                              <p className="text-lg font-bold">{order.total}</p>
                              <span
                                className={`text-sm px-2 py-1 rounded-full ${
                                  isOrderSuccessful(order.status)
                                    ? "bg-green-600 text-white"
                                    : order.status === "PENDING"
                                    ? "bg-yellow-600 text-white"
                                    : order.status === "PAID"
                                    ? "bg-blue-600 text-white"
                                    : "bg-red-600 text-white"
                                }`}
                              >
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4">
                                <Image
                                  src={item.product.photos[0]?.url || "/next.svg"}
                                  alt={item.product.name}
                                  width={72}
                                  height={72}
                                  className="rounded-2xl bg-gray-800 p-1"
                                />
                                <div className="flex-1">
                                  <p className="font-semibold">{item.product.name}</p>
                                  <p className="text-sm text-gray-400">
                                    Quantity: {item.quantity} • Ordered on {order.createdAt}
                                  </p>
                                </div>
                                <div className="w-full md:w-auto flex justify-end gap-2">
                                  {isOrderSuccessful(order.status) ? (
                                    <>
                                      <button className="bg-red-600 hover:bg-red-700 text-sm px-3 py-2 rounded-2xl font-medium">
                                        Reorder
                                      </button>
                                      {(order.status as string) !== "RETURN_REQUESTED" && (order.status as string) !== "RETURNED" && (
                                        <button 
                                          onClick={() => {
                                            setReturnOrderId(order.id);
                                            setReturnModalOpen(true);
                                            setReturnSuccess(false);
                                            setReturnError(null);
                                            setReturnReason("");
                                            setReturnPhotoBase64("");
                                          }}
                                          className="bg-transparent border border-red-600 hover:bg-red-600/10 text-red-500 text-sm px-3 py-2 rounded-2xl font-medium"
                                        >
                                          Return
                                        </button>
                                      )}
                                    </>
                                  ) : (order.status === "PENDING" || order.status === "PAID" || order.status === "SHIPPED") ? (
                                    order.trackingUrl ? (
                                      <a
                                        href={order.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-2xl font-medium inline-block text-center"
                                      >
                                        Track Order
                                      </a>
                                    ) : (
                                      <button className="bg-gray-800 text-gray-500 text-sm px-3 py-2 rounded-2xl font-medium cursor-not-allowed" disabled>
                                        Track Order
                                      </button>
                                    )
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>

                          {order.trackingNumber && (
                            <div className="mt-4 pt-4 border-t border-gray-800 text-xs md:text-sm text-gray-400 space-y-1">
                              <p className="font-semibold text-white mb-1">Shipping & Tracking Details</p>
                              {order.carrier && <p><span className="text-gray-500">Carrier:</span> {order.carrier}</p>}
                              <p><span className="text-gray-500">Tracking ID:</span> {order.trackingNumber}</p>
                              {order.trackingUrl && (
                                <p className="mt-1">
                                  <a
                                    href={order.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-500 hover:text-red-400 underline font-semibold inline-flex items-center gap-1"
                                  >
                                    Track Package &rarr;
                                  </a>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "returns" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Returns & Cancelled Orders</h3>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <p className="mt-2 text-gray-400">Loading returns...</p>
                    </div>
                  ) : orders.filter(order => ["CANCELLED", "RETURN_REQUESTED", "RETURNED"].includes(order.status)).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No returns or cancelled orders found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter(order => ["CANCELLED", "RETURN_REQUESTED", "RETURNED"].includes(order.status)).map((order) => (
                        <div key={order.id} className="bg-gray-900 rounded-3xl p-4 md:p-5">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3 last:mb-0">
                              <div className="flex items-center gap-4">
                                <Image
                                  src={item.product.photos[0]?.url || "/next.svg"}
                                  alt={item.product.name}
                                  width={72}
                                  height={72}
                                  className="rounded-2xl bg-gray-800 p-1"
                                />
                                <div>
                                  <p className="font-semibold">{item.product.name}</p>
                                  <p className="text-sm text-gray-400">
                                    Order #{order.id} • Updated on {order.updatedAt}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-white text-sm px-2 py-1 rounded-full ${
                                  order.status === "CANCELLED" ? "bg-red-600" :
                                  order.status === "RETURN_REQUESTED" ? "bg-yellow-600" : "bg-blue-600"
                                }`}>
                                  {order.status === "CANCELLED" ? "Cancelled" :
                                   order.status === "RETURN_REQUESTED" ? "Return Pending" : "Returned"}
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

              {activeSection === "wishlist" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
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
                        className="inline-block bg-red-600 hover:bg-red-700 px-4 py-2 rounded-2xl text-sm font-medium transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {wishlistItems.slice(0, 6).map((item) => (
                        <div key={item.id} className="bg-gray-900 rounded-3xl p-4 hover:bg-gray-800 transition-colors flex flex-col h-full">
                          <div className="relative aspect-square mb-3 rounded-3xl overflow-hidden bg-gray-800">
                            <Image
                              src={item.img}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                            {item.tag && (
                              <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
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
                            className="mt-auto block w-full bg-red-600 hover:bg-red-700 text-center py-2 rounded-2xl text-sm font-medium transition-colors"
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
                        className="inline-block bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-2xl text-sm font-medium transition-colors"
                      >
                        View All {wishlistItems.length} Items
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[4px] animate-fade-in" onClick={() => setReturnModalOpen(false)}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 max-w-[500px] w-[90%] mx-4 shadow-2xl relative text-left animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 bg-none border-none text-[#aaa] hover:text-white hover:bg-[#333] transition-all text-2xl w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => setReturnModalOpen(false)}
            >
              ×
            </button>

            <h3 className="text-xl font-semibold text-white mb-4 tracking-wide text-center">Request Return</h3>

            {returnError && (
              <div className="bg-red-600/10 border border-red-500/30 p-3 rounded-lg text-red-500 text-sm mb-4 text-center">
                {returnError}
              </div>
            )}

            {returnSuccess ? (
              <div className="bg-green-600/10 border border-green-500/30 p-4 rounded-lg text-green-500 text-center">
                <p className="font-medium text-lg mb-2">✓ Return Requested Successfully</p>
                <p className="text-sm text-gray-400">Our admin team will review your request shortly.</p>
                <button
                  onClick={() => {
                    setReturnModalOpen(false);
                    void fetchData();
                  }}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-[#d32f2f] to-[#b71c1c] text-white font-semibold rounded-lg hover:from-[#e53935] hover:to-[#c62828] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form 
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!returnOrderId) return;
                  if (!returnReason.trim()) {
                    setReturnError("Please enter a reason for the return.");
                    return;
                  }
                  if (!returnPhotoBase64) {
                    setReturnError("Please upload a picture of the product. It is mandatory.");
                    return;
                  }

                  setIsSubmittingReturn(true);
                  setReturnError(null);
                  try {
                    await createReturnRequest({
                      orderId: returnOrderId,
                      reason: returnReason,
                      photoBase64: returnPhotoBase64,
                    });
                    setReturnSuccess(true);
                  } catch (err) {
                    setReturnError(err instanceof Error ? err.message : "Failed to submit return request.");
                  } finally {
                    setIsSubmittingReturn(false);
                  }
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-white">Reason for Return</label>
                  <textarea
                    rows={4}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Describe the reason for returning the product..."
                    className="bg-[#252525] border border-[#333] rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-white">Product Picture (Mandatory)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setReturnPhotoBase64(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f] file:bg-[#333] file:border-none file:text-white file:rounded-md file:px-2 file:py-1 file:mr-2 file:cursor-pointer"
                    required
                  />
                  {returnPhotoBase64 && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <Image src={returnPhotoBase64} alt="Product return preview" fill className="object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="w-full py-3 rounded-lg text-white font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
                    style={{
                      background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
                      border: "none",
                      boxShadow: "0 4px 15px rgba(211, 47, 47, 0.3)",
                    }}
                  >
                    {isSubmittingReturn ? "Submitting..." : "Submit Return Request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(false)}
                    className="w-full py-2.5 rounded-lg bg-transparent text-gray-500 hover:text-gray-300 font-semibold transition-all text-sm border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
