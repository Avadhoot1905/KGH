"use client";

import Image from "next/image";
import { useRef, useState, FormEvent, useEffect } from "react";
import { ProductListItem } from "@/actions/products";
import { updateProductAction } from "@/actions/products";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    } catch (e: any) {
      setError(e?.message || "Failed to update product");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm p-4 bg-white">
      <div className="flex gap-4">
        <div className="relative w-32 h-32 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
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
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg truncate" title={product.name}>{product.name}</h3>
            <span className="text-sm text-gray-500">{new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={product.description}>{product.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mt-3">
            <div><span className="text-gray-500">Price:</span> ${product.price.toFixed(2)}</div>
            <div><span className="text-gray-500">Qty:</span> {product.quantity}</div>
            <div><span className="text-gray-500">License:</span> {product.licenseRequired ? "Required" : "No"}</div>
            <div><span className="text-gray-500">Brand:</span> {product.brand?.name}</div>
            <div><span className="text-gray-500">Type:</span> {product.type?.name}</div>
            <div><span className="text-gray-500">Caliber:</span> {product.caliber?.name}</div>
            <div><span className="text-gray-500">Category:</span> {product.category?.name}</div>
            {product.tag && <div><span className="text-gray-500">Tag:</span> {product.tag}</div>}
            {typeof product.averageRating === "number" && (
              <div><span className="text-gray-500">Avg Rating:</span> {product.averageRating?.toFixed(2)}</div>
            )}
            {typeof product.totalReviews === "number" && (
              <div><span className="text-gray-500">Reviews:</span> {product.totalReviews}</div>
            )}
          </div>
          {product.photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {product.photos.slice(0, 8).map((photo) => (
                <div key={photo.id} className="relative w-14 h-14 rounded bg-gray-50 overflow-hidden border">
                  <Image src={photo.url} alt={photo.alt ?? "photo"} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-50"
          onClick={() => dialogRef.current?.showModal()}
        >
          Edit
        </button>
        <button className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-50" disabled>Delete</button>
      </div>

      <dialog ref={dialogRef} className="rounded-lg p-0 w-full max-w-2xl">
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
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Tag</span>
              <input name="tag" defaultValue={product.tag ?? ""} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Brand Id</span>
              <input name="brandId" placeholder={product.brand?.name} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Type Id</span>
              <input name="typeId" placeholder={product.type?.name} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Caliber Id</span>
              <input name="caliberId" placeholder={product.caliber?.name} className="border rounded px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Category Id</span>
              <input name="categoryId" placeholder={product.category?.name} className="border rounded px-2 py-1.5" />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <button type="button" onClick={() => dialogRef.current?.close()} className="px-3 py-1.5 rounded border bg-white text-sm">Cancel</button>
            <button type="submit" disabled={pending} className="px-3 py-1.5 rounded bg-black text-white text-sm">
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
