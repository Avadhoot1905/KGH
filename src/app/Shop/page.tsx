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
  type FilterOptions,
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
    categories: { id: string; name: string }[];
    products: ProductListItem[];
    fallbackProducts?: ProductListItem[];
    noProductsForCategoryName?: string;
  }>({
    brands: [],
    types: [],
    categories: [],
    products: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [dbError, setDbError] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch products and filters on mount
  React.useEffect(() => {
    async function fetchData() {
      try {
        // Fetch filter options (brands, types, categories) first
        const filterData: FilterOptions = await getFilterOptions();

        // Read category param from URL (accept either display name or id)
        const sp = new URLSearchParams(window.location.search);
        const categoryParam = (sp.get("category") || "").trim();

        let productsResult = await getProducts({ filters: {}, page: 1, pageSize: 24 });

        // If a category param exists, try to resolve it to a category id (match by id or name, case-insensitive)
        if (categoryParam) {
          const matched = filterData.categories.find((c) =>
            c.id === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase()
          );
          if (matched) {
            // fetch products filtered by category id
            const filtered = await getProducts({ filters: { categoryIds: [matched.id] }, page: 1, pageSize: 24 });
            productsResult = filtered;
            // If no products found for this category, also fetch a fallback (unfiltered) list to show below the message
            if ((filtered.items || []).length === 0) {
              const fallback = await getProducts({ filters: {}, page: 1, pageSize: 24 });
              // store fallback details locally
              // we'll merge them into the state below
              const backupProducts = fallback.items;
              const noProductsName = matched.name;
              // set into state after fetching
              setFiltersData((prev) => ({
                ...prev,
                brands: filterData.brands,
                types: filterData.types,
                categories: filterData.categories,
                products: productsResult.items,
                fallbackProducts: backupProducts,
                noProductsForCategoryName: noProductsName,
              }));
              // and then return early to avoid overwriting state again later
              return;
            }
          }
        }

        setFiltersData({
          brands: filterData.brands,
          types: filterData.types,
          categories: filterData.categories,
          products: productsResult.items,
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
                  // If a category was requested and no products found for it, show a message with the category name and then render fallback products (if available)
                  (() => {
                    const fd = filtersData;
                    if (fd.noProductsForCategoryName) {
                      return (
                        <div style={{ textAlign: "center", color: "#bbb", width: "100%" }}>
                          <p>
                            No products found from &quot;{fd.noProductsForCategoryName}&quot;
                          </p>
                          <div className="product-grid">
                            {(fd.fallbackProducts || []).map((product: ProductListItem) => (
                              <Link
                                href={`/ProductDetail/${product.id}`}
                                key={product.id}
                                className="product-card"
                              >
                                {product.photos[0] ? (
                                  <Image
                                    src={product.photos[0].url}
                                    alt={product.photos[0].alt ?? product.name}
                                    width={300}
                                    height={200}
                                    style={{ width: "100%", height: "200px", objectFit: "contain", borderRadius: "8px" }}
                                  />
                                ) : (
                                  <div style={{ height: 200, background: "#222", borderRadius: "8px" }} />
                                )}
                                <h4>{product.name}</h4>
                                <p>{`${product.caliber.name}, ${product.type.name}`}</p>
                                <h3>{formatINR(product.price)}</h3>
                                <button className="add-to-cart">View Product</button>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p style={{ color: "#bbb", textAlign: "center" }}>No products found.</p>
                    );
                  })()
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
