"use client";

import Image from "next/image";
import { useRef, useState, FormEvent, useEffect } from "react";
import { ProductListItem } from "@/actions/products";
import { 
  updateProductAction, 
  deleteProductAction, 
  getAllProductsForSelector,
  getAllBrandsForSelector,
  getAllTypesForSelector,
  getAllCalibersForSelector,
  getAllCategoriesForSelector,
  getAllTagsForSelector,
  addNewTagAction
} from "@/actions/products";
import { useRouter } from "next/navigation";
import RelatedProductsSelector from "./RelatedProductsSelector";
import AutocompleteInput from "./AutocompleteInput";
import TagAutocompleteInput from "./TagAutocompleteInput";

type AdminProductCardProps = {
  product: ProductListItem;
};

export default function AdminProductCard({ product }: AdminProductCardProps) {
  const primaryPhoto = product.photos.find((p) => p.isPrimary) ?? product.photos[0];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>(
    product.relatedProducts?.map((p) => p.id) || []
  );
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [calibers, setCalibers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    setLoadingProducts(true);
    Promise.all([
      getAllProductsForSelector(),
      getAllBrandsForSelector(),
      getAllTypesForSelector(),
      getAllCalibersForSelector(),
      getAllCategoriesForSelector(),
      getAllTagsForSelector(),
    ])
      .then(([productsData, brandsData, typesData, calibersData, categoriesData, tagsData]) => {
        setAllProducts(productsData);
        setBrands(brandsData);
        setTypes(typesData);
        setCalibers(calibersData);
        setCategories(categoriesData);
        setTags(tagsData);
      })
      .catch(() => {
        setError("Failed to load data");
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, []);

  async function handleAddNewTag(tagName: string) {
    try {
      const normalizedTag = await addNewTagAction(tagName);
      setTags((prev) => [...prev, normalizedTag].sort());
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to add new tag:", error);
      throw error;
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    loadProducts();
    setSelectedRelatedIds(product.relatedProducts?.map((p) => p.id) || []);
    dialogRef.current?.showModal();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      await updateProductAction(product.id, formData);
      dialogRef.current?.close();
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update product");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#333] shadow-lg p-6 bg-[#222] text-white transition-colors">
      <div className="flex gap-6">
       <div className="relative w-32 h-32 flex-shrink-0 bg-[#111] rounded-lg overflow-hidden">

          {previewUrl ? (
            <Image src={previewUrl} alt={product.name} fill className="object-contain" />
          ) : primaryPhoto ? (
            <Image
              src={primaryPhoto.url}
              alt={primaryPhoto.alt ?? product.name}
              fill
              className="object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No Image</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
           <h3 className="font-bold text-lg truncate text-white" title={product.name}>{product.name}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2" title={product.description}>{product.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mt-3">
            <div><span className="text-gray-500 dark:text-gray-400">Price:</span> ${product.price.toFixed(2)}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Qty:</span> {product.quantity}</div>
            <div><span className="text-gray-500 dark:text-gray-400">License:</span> {product.licenseRequired ? "Required" : "No"}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Brand:</span> {product.brand?.name}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Type:</span> {product.type?.name}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Caliber:</span> {product.caliber?.name}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Category:</span> {product.category?.name}</div>
            {product.tag && <div><span className="text-gray-500 dark:text-gray-400">Tag:</span> {product.tag}</div>}
            {typeof product.averageRating === "number" && (
              <div><span className="text-gray-500 dark:text-gray-400">Avg Rating:</span> {product.averageRating?.toFixed(2)}</div>
            )}
            {typeof product.totalReviews === "number" && (
              <div><span className="text-gray-500 dark:text-gray-400">Reviews:</span> {product.totalReviews}</div>
            )}
          </div>
          {product.photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {product.photos.slice(0, 8).map((photo) => (
                <div key={photo.id} className="relative w-14 h-14 rounded bg-gray-50 dark:bg-[#111] overflow-hidden border dark:border-[#333]">
                  <Image src={photo.url} alt={photo.alt ?? "photo"} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-4">
        <button className="px-3 py-1.5 rounded border text-sm bg-[#111] text-white hover:bg-[#222] transition-colors" 
        onClick={openDialog} > 
        Edit 
        </button>

        {!showConfirmDelete ? (
          <button
              className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
            onClick={() => {
              setError(null);
              setShowConfirmDelete(true);
            }}
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
              onClick={async () => {
                try {
                  await deleteProductAction(product.id);
                  setShowConfirmDelete(false);
                  router.refresh();
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : "Failed to delete product");
                  setShowConfirmDelete(false);
                }
              }}
            >
              Confirm Delete
            </button>
            <button
              className="px-3 py-1.5 rounded border text-sm bg-[#111] text-white hover:bg-[#222] transition-colors"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>



      <dialog ref={dialogRef} className="rounded-lg p-0 w-full max-w-2xl bg-[#222] text-white">
        <form onSubmit={onSubmit} className="p-6" encType="multipart/form-data">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Product</h2>
            <button type="button" onClick={() => dialogRef.current?.close()} className="text-gray-500">✕</button>
          </div>

          {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm text-gray-600">Product Image</span>
              <input name="photo" type="file" accept="image/*" onChange={onFileChange} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Name</span>
              <input name="name" defaultValue={product.name} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Price</span>
              <input name="price" type="number" step="0.01" defaultValue={product.price} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm text-gray-600">Description</span>
              <textarea name="description" defaultValue={product.description} className="border rounded px-2 py-1.5 min-h-24" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Quantity</span>
              <input name="quantity" type="number" defaultValue={product.quantity} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input name="licenseRequired" type="checkbox" defaultChecked={product.licenseRequired} />
              <span className="text-sm text-gray-700">License Required</span>
            </label>
            <TagAutocompleteInput
              name="tag"
              label="Tag"
              placeholder="e.g., NEW, TOP_SELLER"
              defaultValue={product.tag ?? ""}
              availableTags={tags}
              onAddNewTag={handleAddNewTag}
            />
            <AutocompleteInput
              name="brandName"
              label="Brand Name"
              placeholder="e.g., Glock, Precihole"
              defaultValue={product.brand?.name}
              options={brands}
            />
            <AutocompleteInput
              name="typeName"
              label="Type Name"
              placeholder="e.g., Pistol, Rifle"
              defaultValue={product.type?.name}
              options={types}
            />
            <AutocompleteInput
              name="caliberName"
              label="Caliber Name"
              placeholder="e.g., 9mm, .45 ACP"
              defaultValue={product.caliber?.name}
              options={calibers}
            />
            <AutocompleteInput
              name="categoryName"
              label="Category Name"
              placeholder="e.g., Handgun, Scope"
              defaultValue={product.category?.name}
              options={categories}
            />
            <div className="md:col-span-2">
              {loadingProducts ? (
                <div className="text-sm text-gray-500">Loading products...</div>
              ) : (
                <RelatedProductsSelector
                  products={allProducts}
                  selectedIds={selectedRelatedIds}
                  onChange={setSelectedRelatedIds}
                  currentProductId={product.id}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <button type="button" onClick={() => dialogRef.current?.close()} className="px-3 py-1.5 rounded border text-sm bg-[#111] text-white hover:bg-[#333] transition-colors">Cancel</button>
            <button type="submit" disabled={pending} className="px-3 py-1.5 rounded bg-black text-white text-sm">
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
