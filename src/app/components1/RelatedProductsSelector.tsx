"use client";

import { useState, useRef, useEffect } from "react";

type Product = {
  id: string;
  name: string;
};

type RelatedProductsSelectorProps = {
  products: Product[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  currentProductId?: string;
};

export default function RelatedProductsSelector({
  products,
  selectedIds,
  onChange,
  currentProductId,
}: RelatedProductsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out the current product
  const availableProducts = products.filter((p) => p.id !== currentProductId);
  
  // Filter by search term
  const filteredProducts = availableProducts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProducts = availableProducts.filter((p) => selectedIds.includes(p.id));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProduct = (productId: string) => {
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter((id) => id !== productId));
    } else {
      onChange([...selectedIds, productId]);
    }
  };

  const removeProduct = (productId: string) => {
    onChange(selectedIds.filter((id) => id !== productId));
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
      <span className="text-sm text-gray-600 dark:text-gray-300">Related Products</span>
      
      {/* Input Field with Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search and select products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]"
        />
        {selectedProducts.length > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
            {selectedProducts.length} selected
          </span>
        )}
      </div>

      {/* Selected Products Tags */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedProducts.map((product) => (
            <span
              key={product.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-[#333] rounded text-sm text-black dark:text-white"
            >
              <span className="truncate max-w-[200px]">{product.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeProduct(product.id);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#111] border border-gray-300 dark:border-[#333] rounded shadow-lg z-50 max-h-64 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              {searchTerm ? "No products found" : "No products available"}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#222] cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="accent-black dark:accent-white"
                />
                <span className="text-black dark:text-white">{product.name}</span>
              </label>
            ))
          )}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="relatedProductIds"
        value={selectedIds.join(",")}
      />
    </div>
  );
}
