import { getAllProducts } from "@/actions/products";
import { getAllCategories } from "@/actions/categories";
import AdminProductsClient from "./AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return <AdminProductsClient products={products} categories={categories} />;
}
