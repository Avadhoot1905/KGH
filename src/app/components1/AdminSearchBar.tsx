"use client";

import { useState } from "react";

type AdminSearchBarProps = {
  onSearch: (query: string) => void;
};

export default function AdminSearchBar({ onSearch }: AdminSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <div className="relative w-64">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-9 pr-8 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-600 transition-colors"
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors text-lg font-bold"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
