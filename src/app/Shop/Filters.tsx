"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

type Props = {
  brands: Option[];
  types: Option[];
};

export default function Filters({ brands, types }: Props) {
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
    if (next.length === 0) sp.delete(key); else sp.set(key, next.join(","));
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

  const minPrice = params.get("min") || "";
  const maxPrice = params.get("max") || "";
  const sort = params.get("sort") || "relevance";

  return (
    <aside className="sidebar">
      <h3>FILTERS</h3>

      <div className="filter-group">
        <strong>Brand</strong>
        {brands.map((b) => (
          <label key={b.id}>
            <input
              type="checkbox"
              checked={selectedBrandIds.includes(b.id)}
              onChange={() => toggleInList("brands", b.id)}
            /> {b.name}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <strong>Type</strong>
        <div>
          {types.map((t) => (
            <button
              key={t.id}
              className="pill"
              onClick={() => toggleInList("types", t.id)}
              aria-pressed={selectedTypeIds.includes(t.id)}
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
    </aside>
  );
}


