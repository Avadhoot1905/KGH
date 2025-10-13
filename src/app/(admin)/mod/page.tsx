import { getAllProducts } from "@/actions/products";
import AdminProductsClient from "./AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return <AdminProductsClient products={products} />;
}
