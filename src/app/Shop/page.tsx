"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  type ProductFilters,
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

function ShopContent() {
  const searchParams = useSearchParams();
  const [filtersData, setFiltersData] = useState<{
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
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch filter options (brands, types, categories) on mount only
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const filterData: FilterOptions = await getFilterOptions();
        setFiltersData((prev) => ({
          ...prev,
          brands: filterData.brands,
          types: filterData.types,
          categories: filterData.categories,
        }));
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
        setDbError(true);
      }
    }
    fetchFilterOptions();
  }, []);

  // Fetch products whenever search params change
  useEffect(() => {
    async function fetchProducts() {
      if (filtersData.brands.length === 0) return; // Wait for filter options to load first
      
      setLoading(true);
      try {
        // Parse URL parameters to build filters
        const filters: ProductFilters = {};

        // Brand filters
        const brandsParam = searchParams.get("brands");
        if (brandsParam) {
          filters.brandIds = brandsParam.split(",").filter(Boolean);
        }

        // Type filters
        const typesParam = searchParams.get("types");
        if (typesParam) {
          filters.typeIds = typesParam.split(",").filter(Boolean);
        }

        // Category filter
        const categoryParam = searchParams.get("category");
        if (categoryParam) {
          const matched = filtersData.categories.find((c) =>
            c.id === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase()
          );
          if (matched) {
            filters.categoryIds = [matched.id];
          }
        }

        // Price range filters
        const minParam = searchParams.get("min");
        const maxParam = searchParams.get("max");
        if (minParam) {
          const minPrice = parseFloat(minParam);
          if (!isNaN(minPrice)) {
            filters.minPrice = minPrice;
          }
        }
        if (maxParam) {
          const maxPrice = parseFloat(maxParam);
          if (!isNaN(maxPrice)) {
            filters.maxPrice = maxPrice;
          }
        }

        // Sort filter
        const sortParam = searchParams.get("sort");
        if (sortParam && sortParam !== "relevance") {
          filters.sort = sortParam as ProductFilters["sort"];
        }

        // Fetch products with filters
        const productsResult = await getProducts({ filters, page: 1, pageSize: 24 });

        // If a category was selected and no products found, fetch fallback
        if (categoryParam && productsResult.items.length === 0) {
          const matched = filtersData.categories.find((c) =>
            c.id === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase()
          );
          if (matched) {
            const fallback = await getProducts({ filters: {}, page: 1, pageSize: 24 });
            setFiltersData((prev) => ({
              ...prev,
              products: productsResult.items,
              fallbackProducts: fallback.items,
              noProductsForCategoryName: matched.name,
            }));
            setLoading(false);
            return;
          }
        }

        setFiltersData((prev) => ({
          ...prev,
          products: productsResult.items,
          fallbackProducts: undefined,
          noProductsForCategoryName: undefined,
        }));
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setDbError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams, filtersData.brands, filtersData.categories]);

  return (
    <div>
      <Navbar />

      <div className="shop-page">
        {/* ===== SIDEBAR ===== */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <Filters
            brands={filtersData.brands}
            types={filtersData.types}
            categories={filtersData.categories}
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
          {/* Title row: mobile has a small icon button to the right, sm+ centers the title */}
          <div className="mb-2 flex items-center justify-between sm:justify-center">
            <h2 className="m-0 text-lg font-semibold">FIREARMS COLLECTION</h2>

            {/* mobile-only circular filter button (neutral styling) */}
            <div className="sm:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-transparent border border-white/20 text-white hover:bg-white/10 focus:outline-none"
                aria-label="Open filters"
                title="Filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18M7 12h10M10 20h4" />
                </svg>
              </button>
            </div>
          </div>

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
                       {/* <button className="add-to-cart">
                          View Product
                        </button>*/}
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
 {/*                               <button className="add-to-cart">View Product</button>*/}
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

export default function Page() {
  return (
    <Suspense fallback={
      <div>
        <Navbar />
        <div style={{ textAlign: "center", padding: "50px", color: "#bbb" }}>
          Loading shop...
        </div>
        <Footer />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
