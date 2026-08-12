"use client";

import React, { Suspense, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

type Props = {
  brands: Option[];
  types: Option[];
  categories?: Option[];
  onClose?: () => void;
};

function FiltersInner({ brands, types, onClose, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Buffer state values locally
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [localMin, setLocalMin] = useState<string>("");
  const [localMax, setLocalMax] = useState<string>("");
  const [localSort, setLocalSort] = useState<string>("relevance");

  // Sync initial parameters
  useEffect(() => {
    setSelectedBrandIds((params.get("brands") || "").split(",").filter(Boolean));
    setSelectedTypeIds((params.get("types") || "").split(",").filter(Boolean));
    setSelectedCategory(params.get("category") || "");
    setLocalMin(params.get("min") || "");
    setLocalMax(params.get("max") || "");
    setLocalSort(params.get("sort") || "relevance");
  }, [params]);

  const toggleBrand = (id: string) => {
    setSelectedBrandIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleType = (id: string) => {
    setSelectedTypeIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const sp = new URLSearchParams(params.toString());
    
    if (selectedBrandIds.length === 0) sp.delete("brands");
    else sp.set("brands", selectedBrandIds.join(","));

    if (selectedTypeIds.length === 0) sp.delete("types");
    else sp.set("types", selectedTypeIds.join(","));

    if (!selectedCategory) sp.delete("category");
    else sp.set("category", selectedCategory);

    if (!localMin) sp.delete("min");
    else sp.set("min", localMin);

    if (!localMax) sp.delete("max");
    else sp.set("max", localMax);

    if (localSort === "relevance") sp.delete("sort");
    else sp.set("sort", localSort);

    router.push(`${pathname}?${sp.toString()}`);
    if (onClose) onClose();
  };

  const handleClearAll = () => {
    setSelectedBrandIds([]);
    setSelectedTypeIds([]);
    setSelectedCategory("");
    setLocalMin("");
    setLocalMax("");
    setLocalSort("relevance");
    router.push(pathname);
    if (onClose) onClose();
  };

  return (
    <div className="filters-inner" style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: "20px" }}>
      {onClose && (
        <button className="close-btn" onClick={onClose} aria-label="Close filters">✕</button>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>FILTERS</h3>
        <button
          onClick={handleClearAll}
          style={{
            background: "transparent",
            border: "none",
            color: "#ff3333",
            fontSize: "0.8rem",
            cursor: "pointer",
            padding: 0
          }}
        >
          Clear All
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }}>
        {/* Brand Group */}
        <div className="filter-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Brand</strong>
            {selectedBrandIds.length > 0 && (
              <button
                onClick={() => setSelectedBrandIds([])}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff3333",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div>
            {brands.map((b) => {
              const isActive = selectedBrandIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  className={`pill ${isActive ? "active" : ""}`}
                  onClick={() => toggleBrand(b.id)}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Group */}
        {categories && categories.length > 0 && (
          <div className="filter-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Category</strong>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ff3333",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div>
              {categories.map((c) => {
                const isActive =
                  selectedCategory.toLowerCase() === c.name.toLowerCase() ||
                  selectedCategory === c.id ||
                  (selectedCategory && (
                    c.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                    selectedCategory.toLowerCase().includes(c.name.toLowerCase()) ||
                    (selectedCategory.toLowerCase().includes("air") && c.name.toLowerCase().includes("air"))
                  ));
                return (
                  <button
                    key={c.id}
                    className={`pill ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedCategory(isActive ? "" : c.id)}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Type Group */}
        <div className="filter-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Type</strong>
            {selectedTypeIds.length > 0 && (
              <button
                onClick={() => setSelectedTypeIds([])}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff3333",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div>
            {types.map((t) => (
              <button
                key={t.id}
                className={`pill ${selectedTypeIds.includes(t.id) ? "active" : ""}`}
                onClick={() => toggleType(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Group */}
        <div className="filter-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Price Range</strong>
            {(localMin || localMax) && (
              <button
                onClick={() => {
                  setLocalMin("");
                  setLocalMax("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff3333",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
            <input
              type="number"
              placeholder="Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              style={{ width: "100%", padding: "8px", background: "#222", border: "1px solid #444", borderRadius: "5px", color: "white" }}
            />
            <input
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              style={{ width: "100%", padding: "8px", background: "#222", border: "1px solid #444", borderRadius: "5px", color: "white" }}
            />
          </div>
        </div>

        {/* Sort Group */}
        <div className="filter-group">
          <strong>Sort By</strong>
          <select value={localSort} onChange={(e) => setLocalSort(e.target.value)} style={{ width: "100%", padding: "8px", background: "#222", border: "1px solid #444", borderRadius: "5px", color: "white", marginTop: "5px" }}>
            <option value="relevance">Relevance</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="NEWEST">Newest Arrivals</option>
            <option value="OLDEST">Oldest Arrivals</option>
            <option value="RATING_DESC">Highest Customer Rating</option>
            <option value="POPULARITY">Popularity (Most Reviewed)</option>
            <option value="NAME_ASC">Name: A to Z</option>
            <option value="NAME_DESC">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Apply Button */}
      <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #2a2a2a" }}>
        <button
          onClick={handleApply}
          style={{
            width: "100%",
            padding: "12px",
            background: "#ff3333",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export default function Filters(props: Props) {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <FiltersInner {...props} />
    </Suspense>
  );
}
