"use client";

import { useRef, useState, FormEvent } from "react";
import { createProductAction, getAllProductsForSelector } from "@/actions/products";
import { Category } from "@/actions/categories";
import RelatedProductsSelector from "./RelatedProductsSelector";
import CategorySelect from "./CategorySelect";

type AdminCreateProductProps = {
  buttonClassName?: string;
  categories: Category[];
};

export default function AdminCreateProduct({ buttonClassName, categories }: AdminCreateProductProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);

  async function loadProducts() {
    if (allProducts.length === 0 && !loadingProducts) {
      setLoadingProducts(true);
      try {
        const products = await getAllProductsForSelector();
        setAllProducts(products);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setLoadingProducts(false);
      }
    }
  }

  function openDialog() {
    setError(null);
    setSelectedRelatedIds([]);
    setSelectedCategoryId("");
    setCategoriesList(categories);
    loadProducts();
    dialogRef.current?.showModal();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    
    // Add the selected category ID to the form data
    if (selectedCategoryId) {
      formData.set("categoryId", selectedCategoryId);
    }
    
    try {
      await createProductAction(formData);
      dialogRef.current?.close();
      (event.target as HTMLFormElement).reset();
      setSelectedCategoryId("");
      // Optimistic: rely on page revalidation to refresh list
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setPending(false);
    }
  }

  async function handleCategoryCreated() {
    // Refresh categories list after creating a new one
    const { getAllCategories } = await import("@/actions/categories");
    const updatedCategories = await getAllCategories();
    setCategoriesList(updatedCategories);
  }

  return (
    <>
      <button onClick={openDialog} className={buttonClassName ?? "px-3 py-1.5 rounded bg-black text-white text-sm dark:bg-[#222] dark:text-white border border-gray-300 dark:border-[#333] hover:bg-gray-900 dark:hover:bg-[#333] transition-colors"}>Create +</button>
      <dialog ref={dialogRef} className="rounded-lg p-0 w-full max-w-2xl dark:bg-[#222]">
        <form onSubmit={onSubmit} className="p-6 dark:bg-[#222]" encType="multipart/form-data">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-black dark:text-white">Create Product</h2>
            <button type="button" onClick={() => dialogRef.current?.close()} className="text-gray-500 dark:text-gray-400">✕</button>
          </div>

          {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Product Image (optional)</span>
              <input name="photo" type="file" accept="image/*" className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Name</span>
              <input name="name" required className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Price</span>
              <input name="price" type="number" step="0.01" min={0} required className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Description</span>
              <textarea name="description" required className="border rounded px-2 py-1.5 min-h-24 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Quantity</span>
              <input name="quantity" type="number" min={0} required className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input name="licenseRequired" type="checkbox" className="accent-black dark:accent-white" />
              <span className="text-sm text-gray-700 dark:text-gray-300">License Required</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Tag</span>
              <input name="tag" className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Brand Id</span>
              <input name="brandId" required className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Type Id</span>
              <input name="typeId" required className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Caliber Id</span>
              <input name="caliberId" required className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Category</span>
              <CategorySelect
                categories={categoriesList}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                onCategoryCreated={handleCategoryCreated}
              />
              <input type="hidden" name="categoryId" value={selectedCategoryId} required />
            </label>
            <div className="md:col-span-2">
              {loadingProducts ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading products...</div>
              ) : (
                <RelatedProductsSelector
                  products={allProducts}
                  selectedIds={selectedRelatedIds}
                  onChange={setSelectedRelatedIds}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <button type="button" onClick={() => dialogRef.current?.close()} className="px-3 py-1.5 rounded border bg-white dark:bg-[#111] text-sm text-black dark:text-white border-gray-300 dark:border-[#333]">Cancel</button>
            <button type="submit" disabled={pending} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm border border-red-600 hover:bg-red-700 transition-colors">
              {pending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

