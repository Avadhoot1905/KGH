import { getAllProducts } from "@/actions/products";
import AdminProductCard from "@/app/components1/AdminProductCard";
import SearchBar from "@/app/components1/SearchBar";
import AdminCreateProduct from "@/app/components1/AdminCreateProduct";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white font-sans px-4 py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 border-b border-[#333] pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">All Products</h1>
        <div className="flex items-center gap-3">
          <SearchBar />
          <AdminCreateProduct buttonClassName="px-3 py-1.5 rounded bg-red-600 text-white text-sm border border-red-600 hover:bg-red-700 transition-colors" />
        </div>
      </div>

      {/* Products Section */}
      {products && products.length === 0 ? (
        <p className="text-gray-400 text-center mt-12">No products found.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {products &&
            products.map((product) => (
              <AdminProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </main>
  );
}
