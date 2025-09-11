import { getAllProducts } from "@/actions/products";
import AdminProductCard from "@/app/components1/AdminProductCard";
import SearchBar from "@/app/components1/SearchBar";
import AdminCreateProduct from "@/app/components1/AdminCreateProduct";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6" style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <SearchBar />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h1 className="text-2xl font-semibold">All Products</h1>
          <AdminCreateProduct />
        </div>
      </div>
      {products.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <AdminProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
