"use client";

import { ProductListItem } from "@/actions/products";
import { getAdminOrders, updateOrderStatus, getAdminUsers, updateOrderTracking } from "@/actions/profile";
import { 
  getAllFeedbacks, 
  updateFeedbackShowOnHome, 
  getAllReturnRequests, 
  updateReturnRequestStatus,
  processRazorpayRefundAction
} from "@/actions/feedbackAndReturns";
import { ReturnStatus } from "@prisma/client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const AdminSearchBar = dynamic(() => import("@/app/components1/AdminSearchBar"), {
  ssr: false,
  loading: () => <div className="w-64 h-9 bg-[#1a1a1a] rounded animate-pulse" />
});

const AdminCreateProduct = dynamic(() => import("@/app/components1/AdminCreateProduct"), {
  ssr: false,
  loading: () => <div className="w-20 h-9 bg-red-600 rounded animate-pulse" />
});

const AdminProductCard = dynamic(() => import("@/app/components1/AdminProductCard"), {
  ssr: false,
  loading: () => <div className="h-32 bg-[#1a1a1a] rounded animate-pulse" />
});

const AdminAppointmentsButton = dynamic(() => import("@/app/components1/AdminAppointmentsButton"), {
  ssr: false,
  loading: () => <div className="w-32 h-9 bg-red-600 rounded animate-pulse" />
});

type AdminProductsClientProps = {
  products: ProductListItem[];
};

function ReturnCountdownTimer({ createdAt }: { createdAt: Date | string }) {
  const [timeLeft, setTimeLeft] = useState<number>(300);

  useEffect(() => {
    const startTime = new Date(createdAt).getTime();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 300 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <span className="font-mono text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-700/50">
      {timeLeft > 0 ? `⏱ ${mins}:${secs < 10 ? "0" : ""}${secs}` : "Window Complete"}
    </span>
  );
}

type AdminOrderSummary = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  products: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  razorpayPaymentId: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: Date;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
};

export default function AdminProductsClient({ products }: AdminProductsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "ALL" | "LOW" | "OUT" | "ABOUT_OUT"
  >("ALL");
  const [missingFieldFilter, setMissingFieldFilter] = useState<
    "ALL" | "ANY" | "TAG" | "CATEGORY" | "BRAND" | "TYPE" | "CALIBER" | "PHOTOS" | "DESCRIPTION"
  >("ALL");
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Feedback & Returns states
  const [feedbacks, setFeedbacks] = useState<Array<{
    id: string;
    type: string;
    content: string;
    showOnHome: boolean;
    createdAt: Date;
    userName: string;
    userEmail: string;
  }>>([]);
  const [returns, setReturns] = useState<Array<{
    id: string;
    orderId: string;
    reason: string;
    photoUrl: string;
    status: ReturnStatus;
    createdAt: Date;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
  }>>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(true);
  const [returnsLoading, setReturnsLoading] = useState(true);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.brands?.some(b => b.name.toLowerCase().includes(query)) ||
          product.types?.some(t => t.name.toLowerCase().includes(query)) ||
          product.categories?.some(c => c.name.toLowerCase().includes(query)) ||
          product.calibers?.some(c => c.name.toLowerCase().includes(query))
      );
    }

    // Stock Filter
    switch (stockFilter) {
      case "LOW":
        result = result.filter(
          (product) => product.quantity > 0 && product.quantity <= 5
        );
        break;

      case "ABOUT_OUT":
        result = result.filter(
          (product) => product.quantity > 0 && product.quantity < 10
        );
        break;

      case "OUT":
        result = result.filter(
          (product) => product.quantity === 0
        );
        break;
    }

    // Missing Fields / Audit Filter
    switch (missingFieldFilter) {
      case "TAG":
        result = result.filter((product) => !product.tag || product.tag.trim() === "");
        break;
      case "CATEGORY":
        result = result.filter((product) => !product.categories || product.categories.length === 0);
        break;
      case "BRAND":
        result = result.filter((product) => !product.brands || product.brands.length === 0);
        break;
      case "TYPE":
        result = result.filter((product) => !product.types || product.types.length === 0);
        break;
      case "CALIBER":
        result = result.filter((product) => !product.calibers || product.calibers.length === 0);
        break;
      case "PHOTOS":
        result = result.filter((product) => !product.photos || product.photos.length === 0);
        break;
      case "DESCRIPTION":
        result = result.filter((product) => !product.description || product.description.trim() === "");
        break;
      case "ANY":
        result = result.filter((product) => 
          (!product.tag || product.tag.trim() === "") ||
          (!product.categories || product.categories.length === 0) ||
          (!product.brands || product.brands.length === 0) ||
          (!product.types || product.types.length === 0) ||
          (!product.calibers || product.calibers.length === 0) ||
          (!product.photos || product.photos.length === 0) ||
          (!product.description || product.description.trim() === "")
        );
        break;
    }

    return result;
  }, [products, searchQuery, stockFilter, missingFieldFilter]);

  const lowStockCount = products.filter(
    (p) => p.quantity > 0 && p.quantity <= 5
  ).length;

  const outOfStockCount = products.filter(
    (p) => p.quantity === 0
  ).length;

  const aboutToOutCount = products.filter(
    (p) => p.quantity > 0 && p.quantity < 10
  ).length;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getAdminOrders();
        if (mounted) setOrders(result as AdminOrderSummary[]);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    })();

    (async () => {
      try {
        const result = await getAllFeedbacks();
        if (mounted) setFeedbacks(result);
      } catch (err) {
        console.error("Failed to load feedbacks:", err);
      } finally {
        if (mounted) setFeedbacksLoading(false);
      }
    })();

    (async () => {
      try {
        const result = await getAllReturnRequests();
        if (mounted) setReturns(result);
      } catch (err) {
        console.error("Failed to load returns:", err);
      } finally {
        if (mounted) setReturnsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleShowOnHomeChange = async (feedbackId: string, nextShow: boolean) => {
    try {
      await updateFeedbackShowOnHome(feedbackId, nextShow);
      setFeedbacks((current) => current.map((f) => f.id === feedbackId ? { ...f, showOnHome: nextShow } : f));
    } catch (err) {
      console.error(err);
      alert("Failed to update feedback status");
    }
  };

  const [approvedTimestamps, setApprovedTimestamps] = useState<Record<string, Date>>({});

  const handleReturnStatusUpdate = async (requestId: string, nextStatus: string) => {
    try {
      if (nextStatus === "APPROVED") {
        setApprovedTimestamps((prev) => ({ ...prev, [requestId]: new Date() }));
      }
      await updateReturnStatus(requestId, nextStatus as ReturnStatus);
      setReturns((current) => current.map((r) => r.id === requestId ? { ...r, status: nextStatus as ReturnStatus } : r));
    } catch (err) {
      console.error(err);
      alert("Failed to update return request status");
    }
  };

  // Mock function to avoid TS error if updateReturnStatus is called differently
  const updateReturnStatus = async (id: string, status: ReturnStatus) => {
    return await updateReturnRequestStatus(id, status);
  };

  const handleExportFeedbacksCSV = () => {
    if (feedbacks.length === 0) {
      alert("No feedback to export.");
      return;
    }

    const headers = ["Feedback ID", "Type", "Content", "Show On Home Page", "User Name", "User Email", "Created At"];
    const rows = feedbacks.map(f => [
      f.id,
      f.type,
      f.content,
      f.showOnHome ? "Yes" : "No",
      f.userName,
      f.userEmail,
      new Date(f.createdAt).toLocaleString("en-IN")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          const stringVal = String(val ?? "");
          if (stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')) {
            return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KGH_Feedbacks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReturnsCSV = () => {
    if (returns.length === 0) {
      alert("No returns to export.");
      return;
    }

    const headers = ["Return ID", "Order ID", "Reason", "Status", "Customer Name", "Customer Email", "Total Amount (INR)", "Created At"];
    const rows = returns.map(r => [
      r.id,
      r.orderId,
      r.reason,
      r.status,
      r.customerName,
      r.customerEmail,
      r.totalAmount,
      new Date(r.createdAt).toLocaleString("en-IN")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          const stringVal = String(val ?? "");
          if (stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')) {
            return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KGH_Returns_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    const result = await updateOrderStatus(orderId, nextStatus as "PENDING" | "COMPLETED" | "CANCELLED" | "PAID" | "FAILED" | "DELIVERED" | "SHIPPED" | "RETURNED" | "RETURN_REQUESTED");
    if (result.success) {
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, orderStatus: nextStatus } : order));
    }
  };

  const handleTrackingChange = async (orderId: string, trackingNumber: string, trackingUrl: string, carrier: string) => {
    const result = await updateOrderTracking(orderId, trackingNumber, trackingUrl, carrier);
    if (result.success) {
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, trackingNumber, trackingUrl, carrier } : order));
    } else {
      alert(result.error || "Failed to update tracking info");
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert("No orders to export.");
      return;
    }

    // Define CSV headers
    const headers = [
      "Order ID",
      "Customer Name",
      "Email",
      "Phone Number",
      "Address",
      "City",
      "State",
      "Country",
      "Pincode",
      "Products Ordered",
      "Total Amount (INR)",
      "Razorpay Payment ID",
      "Payment Status",
      "Order Status",
      "Created At"
    ];

    // Build CSV rows
    const rows = orders.map(order => {
      const productSummary = order.products.map(p => `${p.name} (Qty: ${p.quantity}, Price: ₹${p.price})`).join("; ");
      return [
        order.id,
        order.fullName,
        order.email,
        order.phoneNumber,
        order.fullAddress || "",
        order.city,
        order.state,
        order.country,
        order.pincode,
        productSummary,
        order.total,
        order.razorpayPaymentId || "",
        order.paymentStatus,
        order.orderStatus,
        new Date(order.createdAt).toLocaleString("en-IN")
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          const stringVal = String(val ?? "");
          if (stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')) {
            return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KGH_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUsersCSV = async () => {
    try {
      const usersList = await getAdminUsers();
      if (usersList.length === 0) {
        alert("No users to export.");
        return;
      }

      // Define CSV headers
      const headers = [
        "User ID",
        "Name",
        "Email",
        "Contact",
        "Phone Number",
        "Alternate Phone",
        "Role",
        "Profile Completed",
        "Address Line 1",
        "Address Line 2",
        "Landmark",
        "City",
        "State",
        "Country",
        "Pincode",
        "Registered At"
      ];

      // Build CSV rows
      const rows = usersList.map(u => [
        u.id,
        u.name || "",
        u.email || "",
        u.contact || "",
        u.phoneNumber || "",
        u.alternatePhone || "",
        u.role,
        u.profileCompleted ? "Yes" : "No",
        u.addressLine1 || "",
        u.addressLine2 || "",
        u.landmark || "",
        u.city || "",
        u.state || "",
        u.country || "",
        u.pincode || "",
        new Date(u.createdAt).toLocaleString("en-IN")
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          row.map(val => {
            const stringVal = String(val ?? "");
            if (stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"')) {
              return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
          }).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `KGH_Users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export users:", err);
      alert("Failed to export users.");
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white font-sans px-4 py-8 dark:bg-[#0f0f0f] dark:text-white">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 border-b border-[#333] pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">All Products</h1>
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-1">
              Found {filteredProducts.length} of {products.length} products
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const element = document.getElementById("admin-orders-section");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors border border-red-600"
          >
            Go to Orders
          </button>
          <AdminAppointmentsButton />
<AdminSearchBar onSearch={setSearchQuery} />

<select
  value={stockFilter}
  onChange={(e) =>
    setStockFilter(
      e.target.value as "ALL" | "LOW" | "OUT" | "ABOUT_OUT"
    )
  }
  className="rounded border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white max-w-full"
>
  <option value="ALL">All Stock</option>
  <option value="LOW">Low Stock (5 or less) ({lowStockCount})</option>
  <option value="ABOUT_OUT">About to be Sold Out (&lt; 10) ({aboutToOutCount})</option>
  <option value="OUT">Sold Out ({outOfStockCount})</option>
</select>

<select
  value={missingFieldFilter}
  onChange={(e) =>
    setMissingFieldFilter(
      e.target.value as "ALL" | "ANY" | "TAG" | "CATEGORY" | "BRAND" | "TYPE" | "CALIBER" | "PHOTOS" | "DESCRIPTION"
    )
  }
  className="rounded border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white max-w-full"
>
  <option value="ALL">All Fields Present (Audit OK)</option>
  <option value="ANY">Any Missing Field (Audit Error)</option>
  <option value="TAG">Missing Tag</option>
  <option value="CATEGORY">Missing Category</option>
  <option value="BRAND">Missing Brand</option>
  <option value="TYPE">Missing Type</option>
  <option value="CALIBER">Missing Caliber</option>
  <option value="PHOTOS">Missing Photos</option>
  <option value="DESCRIPTION">Missing Description</option>
</select>
          <AdminCreateProduct buttonClassName="px-3 py-1.5 rounded bg-red-600 text-white text-sm border border-red-600 hover:bg-red-700 transition-colors" />
        </div>
      </div>

      {/* Products Section */}
      {products && products.length === 0 ? (
        <p className="text-gray-400 text-center mt-12">No products found.</p>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-2">No products match your search.</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-red-600 hover:text-red-500 text-sm"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredProducts.map((product) => (
            <AdminProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <section id="admin-orders-section" className="mt-10 rounded-xl border border-[#333] bg-[#111] p-6">
        <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Orders &amp; Users Management</h2>
            <p className="text-sm text-gray-400">Review customer details, shipping details, and download user data.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportUsersCSV}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
              style={{
                background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
                border: "none",
              }}
            >
              Export Users to CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
              style={{
                background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                border: "none",
              }}
            >
              Export Orders to CSV
            </button>
            <span className="text-sm text-gray-400">{orders.length} orders</span>
          </div>
        </div>

        {ordersLoading ? (
          <p className="text-gray-400">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-400">No orders found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="font-semibold text-white">Customer Details</p>
                    <p><span className="text-gray-500">Name:</span> {order.fullName || '—'}</p>
                    <p><span className="text-gray-500">Email:</span> {order.email || '—'}</p>
                    <p><span className="text-gray-500">Phone:</span> {order.phoneNumber || '—'}</p>

                    <p className="pt-2 font-semibold text-white">Shipping Details</p>
                    <p><span className="text-gray-500">Address:</span> {order.fullAddress || '—'}</p>
                    <p><span className="text-gray-500">City / State:</span> {order.city || '—'}{order.city && order.state ? `, ${order.state}` : ''}</p>
                    <p><span className="text-gray-500">Country / Pincode:</span> {order.country || '—'}{order.country && order.pincode ? ` / ${order.pincode}` : ''}</p>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="font-semibold text-white">Order Details</p>
                    <p><span className="text-gray-500">Products:</span> {order.products.map((item) => `${item.name} × ${item.quantity}`).join(', ') || '—'}</p>
                    <p><span className="text-gray-500">Total Amount:</span> ₹{order.total.toLocaleString('en-IN')}</p>
                    <p><span className="text-gray-500">Razorpay Payment ID:</span> {order.razorpayPaymentId || '—'}</p>
                    <p><span className="text-gray-500">Payment Status:</span> {order.paymentStatus}</p>
                    <p><span className="text-gray-500">Order Status:</span> {order.orderStatus}</p>
                    <p><span className="text-gray-500">Date:</span> {new Date(order.createdAt).toLocaleString('en-IN')}</p>
                    <label className="block pt-2 text-xs uppercase tracking-wide text-gray-500">
                      Update Status
                      <select
                        value={order.orderStatus}
                        onChange={(event) => void handleStatusChange(order.id, event.target.value)}
                        className="mt-2 w-full rounded border border-[#333] bg-[#0f0f0f] px-3 py-2 text-sm text-white"
                      >
                        <option value="PENDING">PENDING (In Transit)</option>
                        <option value="PAID">PAID</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
                        <option value="RETURNED">RETURNED / REFUNDED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="FAILED">FAILED</option>
                      </select>
                    </label>

                    <div className="pt-4 border-t border-[#2a2a2a] mt-4 space-y-2">
                      <p className="font-semibold text-white text-xs uppercase tracking-wide">Tracking Information</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block text-xs text-gray-500">
                          Carrier
                          <input
                            type="text"
                            placeholder="e.g. DHL, BlueDart"
                            defaultValue={order.carrier || ""}
                            onBlur={async (e) => {
                              await handleTrackingChange(order.id, order.trackingNumber || "", order.trackingUrl || "", e.target.value);
                            }}
                            className="mt-1 w-full rounded border border-[#333] bg-[#0f0f0f] px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                          />
                        </label>
                        <label className="block text-xs text-gray-500">
                          Tracking Number / ID
                          <input
                            type="text"
                            placeholder="e.g. 12345678"
                            defaultValue={order.trackingNumber || ""}
                            onBlur={async (e) => {
                              await handleTrackingChange(order.id, e.target.value, order.trackingUrl || "", order.carrier || "");
                            }}
                            className="mt-1 w-full rounded border border-[#333] bg-[#0f0f0f] px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                          />
                        </label>
                      </div>
                      
                      <label className="block text-xs text-gray-500">
                        Tracking Link / URL
                        <input
                          type="url"
                          placeholder="e.g. https://dhl.com/track?id=..."
                          defaultValue={order.trackingUrl || ""}
                          onBlur={async (e) => {
                            await handleTrackingChange(order.id, order.trackingNumber || "", e.target.value, order.carrier || "");
                          }}
                          className="mt-1 w-full rounded border border-[#333] bg-[#0f0f0f] px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Returns Management Section */}
      <section id="admin-returns-section" className="mt-10 rounded-xl border border-[#333] bg-[#111] p-6">
        <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Returns Management</h2>
            <p className="text-sm text-gray-400">Review customer return requests, reasons, uploaded photos, and update their statuses.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportReturnsCSV}
              className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                border: "none",
              }}
            >
              Export Returns to CSV
            </button>
            <span className="text-sm text-gray-400">{returns.length} return requests</span>
          </div>
        </div>

        {returnsLoading ? (
          <p className="text-gray-400">Loading return requests...</p>
        ) : returns.length === 0 ? (
          <p className="text-gray-400">No return requests found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {returns.map((req) => (
              <div key={req.id} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="font-semibold text-white">Customer & Order Info</p>
                    <p><span className="text-gray-500">Customer:</span> {req.customerName} ({req.customerEmail})</p>
                    <p><span className="text-gray-500">Order ID:</span> #{req.orderId}</p>
                    <p><span className="text-gray-500">Order Amount:</span> ₹{req.totalAmount.toLocaleString('en-IN')}</p>
                    <p><span className="text-gray-500">Requested:</span> {new Date(req.createdAt).toLocaleString('en-IN')}</p>
                    
                    <p className="pt-2 font-semibold text-white">Reason for Return</p>
                    <p className="italic bg-[#111] p-3 rounded border border-[#333] text-gray-400">{req.reason}</p>
                  </div>

                  <div className="space-y-4 text-sm text-gray-300">
                    <div>
                      <p className="font-semibold text-white mb-2">Uploaded Picture</p>
                      {req.photoUrl ? (
                        <div className="relative w-32 h-32 rounded-lg border border-[#333] bg-black/40 overflow-hidden group cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={req.photoUrl} 
                            alt="Return product" 
                            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                            onClick={() => window.open(req.photoUrl, "_blank")}
                          />
                        </div>
                      ) : (
                        <p className="text-red-500 text-xs font-semibold">No Image Provided</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs uppercase tracking-wide text-gray-500">
                        Update Return Status
                        <select
                          value={req.status}
                          onChange={(event) => void handleReturnStatusUpdate(req.id, event.target.value)}
                          className="mt-2 w-full rounded border border-[#333] bg-[#0f0f0f] px-3 py-2 text-sm text-white cursor-pointer"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED (Awaiting Final Confirmation / 5m Window)</option>
                          <option value="REJECTED">REJECTED (Declined)</option>
                        </select>
                      </label>

                      {req.status === "APPROVED" && (
                        <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-800/40 text-xs space-y-2">
                          <p className="text-yellow-400 font-semibold flex items-center justify-between">
                            <span>Status: Approved (5-min window)</span>
                            <ReturnCountdownTimer createdAt={approvedTimestamps[req.id] || req.createdAt} />
                          </p>
                          <p className="text-gray-400">
                            The return request is marked approved. You can revert this status if marked by mistake, or confirm to trigger the Razorpay API refund immediately.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Confirm approval & trigger immediate Razorpay refund for this order?")) {
                                  try {
                                    const res = await processRazorpayRefundAction(req.orderId);
                                    if (res.success) {
                                      alert(`Razorpay refund initiated successfully! (Refund ID: ${res.refundId})`);
                                    }
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : "Failed to process refund");
                                  }
                                }
                              }}
                              className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold cursor-pointer"
                            >
                              Confirm Approval &amp; Refund Now
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReturnStatusUpdate(req.id, "PENDING")}
                              className="px-3 py-1.5 rounded border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold cursor-pointer"
                            >
                              Revert to Pending
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feedbacks / Complaints / Testimonials Management Section */}
      <section id="admin-feedbacks-section" className="mt-10 rounded-xl border border-[#333] bg-[#111] p-6">
        <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Feedbacks, Complaints &amp; Testimonials</h2>
            <p className="text-sm text-gray-400">Review feedback submissions, log issues/complaints, and approve testimonials to display on the Home page.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportFeedbacksCSV}
              className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                border: "none",
              }}
            >
              Export Feedbacks to CSV
            </button>
            <span className="text-sm text-gray-400">{feedbacks.length} submissions</span>
          </div>
        </div>

        {feedbacksLoading ? (
          <p className="text-gray-400">Loading feedbacks...</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-gray-400">No submissions found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {feedbacks.map((f) => (
              <div key={f.id} className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 text-sm flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white uppercase tracking-wider ${
                        f.type === "COMPLAINT" ? "bg-red-600" :
                        f.type === "TESTIMONIAL" ? "bg-purple-600" : "bg-blue-600"
                      }`}>
                        {f.type}
                      </span>
                      <span className="text-gray-500 text-xs">Submitted on {new Date(f.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-white text-base leading-relaxed">{f.content}</p>
                    <p className="text-xs text-gray-500 pt-1">By: <strong className="text-gray-300">{f.userName}</strong> ({f.userEmail})</p>
                  </div>

                  {f.type === "TESTIMONIAL" && (
                    <div className="flex items-center gap-2 bg-[#111] p-3 rounded-lg border border-[#333] shrink-0">
                      <label className="text-xs text-gray-400 cursor-pointer select-none" htmlFor={`home-toggle-${f.id}`}>
                        Show on Home Page
                      </label>
                      <input 
                        id={`home-toggle-${f.id}`}
                        type="checkbox"
                        checked={f.showOnHome}
                        onChange={(e) => void handleShowOnHomeChange(f.id, e.target.checked)}
                        className="w-4 h-4 accent-red-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
