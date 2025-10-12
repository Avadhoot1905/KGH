"use client";

import { ProductListItem } from "@/actions/products";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react";

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

type AdminProductsClientProps = {
  products: ProductListItem[];
};

export default function AdminProductsClient({ products }: AdminProductsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.brand?.name.toLowerCase().includes(query) ||
        product.type?.name.toLowerCase().includes(query) ||
        product.category?.name.toLowerCase().includes(query) ||
        product.caliber?.name.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white font-sans px-4 py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 border-b border-[#333] pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">All Products</h1>
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-1">
              Found {filteredProducts.length} of {products.length} products
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <AdminSearchBar onSearch={setSearchQuery} />
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
    </main>
  );
}
