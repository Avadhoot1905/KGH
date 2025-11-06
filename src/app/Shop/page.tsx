"use client";
import React, { useState } from "react";
import "./shop.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";
import Filters from "./Filters";
import Link from "next/link";
import Image from "next/image";
import {
  getProducts,
  getFilterOptions,
  type ProductListItem,
} from "@/actions/products";

function formatINR(amount: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  }
}

export default function Page() {
  const [filtersData, setFiltersData] = React.useState<{
    brands: { id: string; name: string }[];
    types: { id: string; name: string }[];
    products: ProductListItem[];
  }>({
    brands: [],
    types: [],
    products: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [dbError, setDbError] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch products and filters on mount
  React.useEffect(() => {
    async function fetchData() {
      try {
        const [productData, filterData] = await Promise.all([
          getProducts({ filters: {}, page: 1, pageSize: 24 }),
          getFilterOptions(),
        ]);
        setFiltersData({
          brands: filterData.brands,
          types: filterData.types,
          products: productData.items,
        });
      } catch (err) {
        console.error("Database connection failed:", err);
        setDbError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <Navbar />

      <div className="shop-page">
        {/* ===== MOBILE FILTER BUTTON ===== */}
        <div className="mobile-filter-btn">
          <button onClick={() => setSidebarOpen(true)}>☰ Filters</button>
        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <Filters
            brands={filtersData.brands}
            types={filtersData.types}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* Overlay (when sidebar open on mobile) */}
        {sidebarOpen && (
          <div
            className="overlay"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <main className="content">
          <h2>FIREARMS COLLECTION</h2>

          {loading ? (
            <p style={{ color: "#bbb", textAlign: "center" }}>
              Loading products...
            </p>
          ) : dbError ? (
            <div style={{ color: "#c0392b", textAlign: "center" }}>
              <h3>⚠️ Unable to connect to the database</h3>
              <p>Please try again later.</p>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="product-grid">
                {filtersData.products.length > 0 ? (
                  filtersData.products.map((product: ProductListItem) => {
                    const primaryPhoto =
                      product.photos.find((p) => p.isPrimary) ??
                      product.photos[0];
                    const subtitle = `${product.caliber.name}, ${product.type.name}`;

                    return (
                      <Link
                        href={`/ProductDetail/${product.id}`}
                        key={product.id}
                        className="product-card"
                      >
                        {product.tag && (
                          <span
                            className={`tag ${
                              product.tag === "NEW" ? "new" : "top"
                            }`}
                          >
                            {product.tag}
                          </span>
                        )}
                        {primaryPhoto ? (
                          <Image
                            src={primaryPhoto.url}
                            alt={primaryPhoto.alt ?? product.name}
                            width={300}
                            height={200}
                            style={{
                              width: "100%",
                              height: "200px",
                              objectFit: "contain",
                              borderRadius: "8px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 200,
                              background: "#222",
                              borderRadius: "8px",
                            }}
                          />
                        )}
                        <h4>{product.name}</h4>
                        <p>{subtitle}</p>
                        <h3>{formatINR(product.price)}</h3>
                        <button className="add-to-cart">
                          View Product
                        </button>
                      </Link>
                    );
                  })
                ) : (
                  <p style={{ color: "#bbb", textAlign: "center" }}>
                    No products found.
                  </p>
                )}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span className="active">1</span>
                <span>2</span>
                <span>3</span>
                <span>...</span>
                <span>7</span>
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
