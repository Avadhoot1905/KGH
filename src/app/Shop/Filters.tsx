"use client";

import React, { Suspense } from "react";
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

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (value === null || value.length === 0) sp.delete(key);
    else sp.set(key, value);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const toggleInList = (key: string, id: string) => {
    const sp = new URLSearchParams(params.toString());
    const current = sp.get(key)?.split(",").filter(Boolean) ?? [];
    const exists = current.includes(id);
    const next = exists ? current.filter((x) => x !== id) : [...current, id];
    if (next.length === 0) sp.delete(key);
    else sp.set(key, next.join(","));
    router.push(`${pathname}?${sp.toString()}`);
  };

  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setParam("sort", value === "relevance" ? null : value);
  };

  const onPriceChange = (min: string, max: string) => {
    setParam("min", min || null);
    setParam("max", max || null);
  };

  const selectedBrandIds = (params.get("brands") || "").split(",").filter(Boolean);
  const selectedTypeIds = (params.get("types") || "").split(",").filter(Boolean);
  const selectedCategory = params.get("category") || "";
  const minPrice = params.get("min") || "";
  const maxPrice = params.get("max") || "";
  const sort = params.get("sort") || "relevance";

  return (
    <div className="filters-inner">
      {onClose && (
        <button className="close-btn" onClick={onClose} aria-label="Close filters">✕</button>
      )}

      <h3>FILTERS</h3>

      <div className="filter-group">
        <strong>Brand</strong>
        {brands.map((b) => (
          <label key={b.id}>
            <input
              type="checkbox"
              checked={selectedBrandIds.includes(b.id)}
              onChange={() => toggleInList("brands", b.id)}
            />{" "}
            {b.name}
          </label>
        ))}
      </div>

  {categories && categories.length > 0 && (
        <div className="filter-group">
          <strong>Category</strong>
          <div>
            {categories.map((c) => {
              const isActive = selectedCategory === c.id || selectedCategory === c.name;
              return (
                <button
                  key={c.id}
                  className={`pill ${isActive ? "active" : ""}`}
                  onClick={() => setParam("category", isActive ? null : c.name)}
                >
                  {c.name}
                </button>
              );
            })}
            {selectedCategory && (
              <button className="pill clear" onClick={() => setParam("category", null)}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <div className="filter-group">
        <strong>Type</strong>
        <div>
          {types.map((t) => (
            <button
              key={t.id}
              className={`pill ${selectedTypeIds.includes(t.id) ? "active" : ""}`}
              onClick={() => toggleInList("types", t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <strong>Price Range</strong>
        <input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => onPriceChange(e.target.value, maxPrice)}
        />
        <input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => onPriceChange(minPrice, e.target.value)}
        />
      </div>

      <div className="filter-group">
        <strong>Sort By</strong>
        <select value={sort} onChange={onSortChange}>
          <option value="relevance">Relevance</option>
          <option value="PRICE_ASC">Price: Low to High</option>
          <option value="PRICE_DESC">Price: High to Low</option>
        </select>
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
