"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./shop.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";
import Filters from "./Filters";
import Link from "next/link";
import QuickWishlistButton from "../components1/QuickWishlistButton";
import QuickAddToCartButton from "../components1/QuickAddToCartButton";
import ProductCardGallery from "../components1/ProductCardGallery";
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
  const router = useRouter();
  const pathname = usePathname();
  const [filtersData, setFiltersData] = useState<{
    brands: { id: string; name: string }[];
    types: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    products: ProductListItem[];
    fallbackProducts?: ProductListItem[];
    noProductsForCategoryName?: string;
    totalPages: number;
    currentPage: number;
  }>({
    brands: [],
    types: [],
    categories: [],
    products: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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
      } finally {
        setInitialLoadDone(true);
      }
    }
    fetchFilterOptions();
  }, []);

  // Fetch products whenever search params change
  useEffect(() => {
    async function fetchProducts() {
      if (!initialLoadDone) return; // Wait for filter options to load first
      
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
          let matched = filtersData.categories.find(
            (c) =>
              c.id === categoryParam ||
              c.name.toLowerCase() === categoryParam.toLowerCase()
          );

          if (!matched) {
            matched = filtersData.categories.find(
              (c) =>
                c.name.toLowerCase().includes(categoryParam.toLowerCase()) ||
                categoryParam.toLowerCase().includes(c.name.toLowerCase()) ||
                (categoryParam.toLowerCase().includes("air") && c.name.toLowerCase().includes("air"))
            );
          }

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

        // Search filter
        const queryParam = searchParams.get("q") || searchParams.get("search") || "";
        if (queryParam.trim()) {
          filters.search = queryParam.trim();
        }

        // Sort filter
        const sortParam = searchParams.get("sort");
        if (sortParam && sortParam !== "relevance") {
          filters.sort = sortParam as ProductFilters["sort"];
        }

        // Parse page parameter
        const pageParam = searchParams.get("page");
        const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;

        // Fetch products with filters
        const productsResult = await getProducts({ filters, page, pageSize: 24 });

        // If a category was selected and no products found, fetch fallback
        if (categoryParam && productsResult.items.length === 0) {
          const matched = filtersData.categories.find(
            (c) =>
              c.id === categoryParam ||
              c.name.toLowerCase() === (categoryParam || "").toLowerCase()
          );
          if (matched) {
            const fallback = await getProducts({ filters: {}, page: 1, pageSize: 24 });
            setFiltersData((prev) => ({
              ...prev,
              products: productsResult.items,
              totalPages: productsResult.totalPages,
              currentPage: productsResult.page,
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
          totalPages: productsResult.totalPages,
          currentPage: productsResult.page,
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
  }, [searchParams, initialLoadDone, filtersData.categories]);

  const categoryQuery = searchParams.get("category") || "";
  const matchedCategory = categoryQuery
    ? filtersData.categories.find(
        (c) =>
          c.id === categoryQuery ||
          c.name.toLowerCase() === categoryQuery.toLowerCase()
      ) ||
      filtersData.categories.find(
        (c) =>
          c.name.toLowerCase().includes(categoryQuery.toLowerCase()) ||
          categoryQuery.toLowerCase().includes(c.name.toLowerCase()) ||
          (categoryQuery.toLowerCase().includes("air") && c.name.toLowerCase().includes("air"))
      )
    : undefined;

  const selectedCategoryName = matchedCategory?.name;
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
            <h2 className="m-0 text-lg font-semibold">
  {selectedCategoryName
    ? `${selectedCategoryName.toUpperCase()} COLLECTION`
    : "FIREARMS COLLECTION"}
</h2>
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

          {/* Active Filters Bar like Goibibo */}
          {(() => {
            const activeBrands = (searchParams.get("brands") || "").split(",").filter(Boolean);
            const activeTypes = (searchParams.get("types") || "").split(",").filter(Boolean);
            const activeCategory = searchParams.get("category") || "";
            const minPrice = searchParams.get("min") || "";
            const maxPrice = searchParams.get("max") || "";

            const hasActiveFilters = activeBrands.length > 0 || activeTypes.length > 0 || activeCategory || minPrice || maxPrice;

            if (!hasActiveFilters) return null;

            const removeBrand = (id: string) => {
              const sp = new URLSearchParams(searchParams.toString());
              const updated = activeBrands.filter(b => b !== id);
              if (updated.length === 0) sp.delete("brands");
              else sp.set("brands", updated.join(","));
              router.push(`${pathname}?${sp.toString()}`);
            };

            const removeType = (id: string) => {
              const sp = new URLSearchParams(searchParams.toString());
              const updated = activeTypes.filter(t => t !== id);
              if (updated.length === 0) sp.delete("types");
              else sp.set("types", updated.join(","));
              router.push(`${pathname}?${sp.toString()}`);
            };

            const clearAll = () => {
              const sp = new URLSearchParams(searchParams.toString());
              sp.delete("brands");
              sp.delete("types");
              sp.delete("category");
              sp.delete("min");
              sp.delete("max");
              router.push(`${pathname}?${sp.toString()}`);
            };

            return (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "1.5rem", padding: "8px 12px", background: "#151515", borderRadius: "8px", border: "1px solid #222" }}>
                <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: "600", marginRight: "4px" }}>Active Filters:</span>
                
                {activeCategory && (() => {
                  const catObj = filtersData.categories.find(c => c.id === activeCategory || c.name.toLowerCase() === activeCategory.toLowerCase());
                  return (
                    <span key="cat" style={{ display: "inline-flex", alignItems: "center", background: "#ff3333", color: "#fff", padding: "4px 10px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "500" }}>
                      Category: {catObj?.name || activeCategory}
                      <button onClick={() => {
                        const sp = new URLSearchParams(searchParams.toString());
                        sp.delete("category");
                        router.push(`${pathname}?${sp.toString()}`);
                      }} style={{ background: "transparent", border: "none", color: "#fff", marginLeft: "6px", cursor: "pointer", fontWeight: "bold", padding: 0 }}>✕</button>
                    </span>
                  );
                })()}

                {activeBrands.map(bId => {
                  const bObj = filtersData.brands.find(b => b.id === bId);
                  return (
                    <span key={bId} style={{ display: "inline-flex", alignItems: "center", background: "#ff3333", color: "#fff", padding: "4px 10px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "500" }}>
                      Brand: {bObj?.name || bId}
                      <button onClick={() => removeBrand(bId)} style={{ background: "transparent", border: "none", color: "#fff", marginLeft: "6px", cursor: "pointer", fontWeight: "bold", padding: 0 }}>✕</button>
                    </span>
                  );
                })}

                {activeTypes.map(tId => {
                  const tObj = filtersData.types.find(t => t.id === tId);
                  return (
                    <span key={tId} style={{ display: "inline-flex", alignItems: "center", background: "#ff3333", color: "#fff", padding: "4px 10px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "500" }}>
                      Type: {tObj?.name || tId}
                      <button onClick={() => removeType(tId)} style={{ background: "transparent", border: "none", color: "#fff", marginLeft: "6px", cursor: "pointer", fontWeight: "bold", padding: 0 }}>✕</button>
                    </span>
                  );
                })}

                {(minPrice || maxPrice) && (
                  <span style={{ display: "inline-flex", alignItems: "center", background: "#ff3333", color: "#fff", padding: "4px 10px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "500" }}>
                    Price: {minPrice ? `₹${minPrice}` : "0"} - {maxPrice ? `₹${maxPrice}` : "Max"}
                    <button onClick={() => {
                      const sp = new URLSearchParams(searchParams.toString());
                      sp.delete("min");
                      sp.delete("max");
                      router.push(`${pathname}?${sp.toString()}`);
                    }} style={{ background: "transparent", border: "none", color: "#fff", marginLeft: "6px", cursor: "pointer", fontWeight: "bold", padding: 0 }}>✕</button>
                  </span>
                )}

                <button onClick={clearAll} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#ff3333", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", padding: "4px 8px" }}>
                  Clear All
                </button>
              </div>
            );
          })()}

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
                    const subtitle = `${product.calibers.map(c => c.name).join(", ")}, ${product.types.map(t => t.name).join(", ")}`;

                    return (
                      <div
                        key={product.id}
                        className="product-card-wrapper"
                        style={{ position: "relative" }}
                      >
                        <QuickWishlistButton productId={product.id} />
                        <Link
                          href={`/ProductDetail/${product.id}`}
                          className="product-card"
                        >
                          {product.tag && product.tag.split(",").map((t) => t.trim()).filter(Boolean).map((t, idx) => (
                            <span
                              key={idx}
                              className={`tag ${
                                t === "NEW" ? "new" : "top"
                              }`}
                              style={{ marginRight: 4, display: 'inline-block' }}
                            >
                              {t}
                            </span>
                          ))}
                          <ProductCardGallery photos={product.photos} productName={product.name} height="200px" />
                          <h4>{product.name}</h4>
                          <p>{subtitle}</p>
                          <div className="product-card-bottom">
                            <h3>{formatINR(product.price)}</h3>
                            <QuickAddToCartButton productId={product.id} licenseRequired={product.licenseRequired} productQuantity={product.quantity} />
                          </div>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  // If a category was requested and no products found for it, show a message with the category name and then render fallback products (if available)
                  (() => {
                    const fd = filtersData;
                    if (fd.noProductsForCategoryName) {
                      return (
                        <div style={{ textAlign: "center", color: "#bbb", width: "100%", gridColumn: "1 / -1" }}>
                          <p style={{ marginBottom: "1.5rem" }}>
                            No products found from &quot;{fd.noProductsForCategoryName}&quot;. Showing other products:
                          </p>
                          <div className="product-grid" style={{ width: "100%" }}>
                            {(fd.fallbackProducts || []).map((product: ProductListItem) => (
                              <div
                                key={product.id}
                                className="product-card-wrapper"
                                style={{ position: "relative", width: "100%" }}
                              >
                                <QuickWishlistButton productId={product.id} />
                                <Link
                                  href={`/ProductDetail/${product.id}`}
                                  className="product-card"
                                >
                                  {product.tag && product.tag.split(",").map((t) => t.trim()).filter(Boolean).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className={`tag ${
                                        t === "NEW" ? "new" : "top"
                                      }`}
                                      style={{ marginRight: 4, display: 'inline-block' }}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                  <ProductCardGallery photos={product.photos} productName={product.name} height="200px" />
                                  <h4>{product.name}</h4>
                                  <p>{`${product.calibers.map(c => c.name).join(", ")}, ${product.types.map(t => t.name).join(", ")}`}</p>
                                  <div className="product-card-bottom">
                                    <h3>{formatINR(product.price)}</h3>
                                    <QuickAddToCartButton productId={product.id} licenseRequired={product.licenseRequired} />
                                  </div>
                                </Link>
                              </div>
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
              {filtersData.totalPages > 1 && (
                <div className="pagination" style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
                  {Array.from({ length: filtersData.totalPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === filtersData.currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          const sp = new URLSearchParams(searchParams.toString());
                          sp.set("page", pageNum.toString());
                          router.push(`${pathname}?${sp.toString()}`);
                        }}
                        className={isCurrent ? "active" : ""}
                        style={{
                          minWidth: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          border: isCurrent ? "none" : "1px solid #333",
                          backgroundColor: isCurrent ? "#dc2626" : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: isCurrent ? "bold" : "normal",
                          fontSize: "14px",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              )}
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
