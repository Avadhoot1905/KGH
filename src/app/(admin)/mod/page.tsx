import { getAllProducts } from "@/actions/products";
import AdminProductCard from "@/app/components1/AdminProductCard";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">All Products</h1>
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
