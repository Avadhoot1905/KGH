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
  addNewTagAction,
  addNewTypeAction,
  editTypeAction,
  deleteTypeAction,
  editTagAction,
  deleteTagAction,
  addNewBrandAction,
  editBrandAction,
  deleteBrandAction,
  addNewCaliberAction,
  editCaliberAction,
  deleteCaliberAction,
  addNewCategoryAction,
  editCategoryAction,
  deleteCategoryAction
} from "@/actions/products";
import { useRouter } from "next/navigation";
import RelatedProductsSelector from "./RelatedProductsSelector";
import ManageableAutocompleteInput from "./ManageableAutocompleteInput";

type AdminProductCardProps = {
  product: ProductListItem;
};

type ManageablePhoto = {
  id?: string;
  url: string;
  file?: File;
  isPrimary: boolean;
  position: number;
};

export default function AdminProductCard({ product }: AdminProductCardProps) {
  const primaryPhoto = product.photos.find((p) => p.isPrimary) ?? product.photos[0];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState<number | null>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>(
    product.relatedProducts?.map((p) => p.id) || []
  );
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [calibers, setCalibers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  // Stateful photo list for editing
  const [photos, setPhotos] = useState<ManageablePhoto[]>([]);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

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
      const normalizedTag = await addNewTagAction(tagName, false);
      setTags((prev) => [...prev, normalizedTag].sort());
      return normalizedTag;
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        const confirmBypass = window.confirm(`${error.message} Are you sure you want to create one anyway?`);
        if (confirmBypass) {
          const normalizedTag = await addNewTagAction(tagName, true);
          setTags((prev) => [...prev, normalizedTag].sort());
          return normalizedTag;
        }
      }
      console.error("Failed to add new tag:", error);
      throw error;
    }
  }

  async function handleEditTag(oldTag: string, newTag: string) {
    await editTagAction(oldTag, newTag);
    setTags((prev) => prev.map((t) => (t === oldTag ? newTag : t)).sort());
  }

  async function handleDeleteTag(tagToDelete: string) {
    await deleteTagAction(tagToDelete);
    setTags((prev) => prev.filter((t) => t !== tagToDelete));
  }

  async function handleAddNewType(typeName: string) {
    try {
      const createdType = await addNewTypeAction(typeName);
      setTypes((prev) => [...prev, createdType].sort());
      return createdType;
    } catch (error) {
      console.error("Failed to add new type:", error);
      throw error;
    }
  }

  async function handleEditType(oldType: string, newType: string) {
    await editTypeAction(oldType, newType);
    setTypes((prev) => prev.map((t) => (t === oldType ? newType : t)).sort());
  }

  async function handleDeleteType(typeToDelete: string) {
    await deleteTypeAction(typeToDelete);
    setTypes((prev) => prev.filter((t) => t !== typeToDelete));
  }

  async function handleAddNewBrand(brandName: string) {
    try {
      const createdBrand = await addNewBrandAction(brandName);
      setBrands((prev) => [...prev, createdBrand].sort());
      return createdBrand;
    } catch (error) {
      console.error("Failed to add new brand:", error);
      throw error;
    }
  }

  async function handleEditBrand(oldBrand: string, newBrand: string) {
    await editBrandAction(oldBrand, newBrand);
    setBrands((prev) => prev.map((b) => (b === oldBrand ? newBrand : b)).sort());
  }

  async function handleDeleteBrand(brandToDelete: string) {
    await deleteBrandAction(brandToDelete);
    setBrands((prev) => prev.filter((b) => b !== brandToDelete));
  }

  async function handleAddNewCaliber(caliberName: string) {
    try {
      const createdCaliber = await addNewCaliberAction(caliberName);
      setCalibers((prev) => [...prev, createdCaliber].sort());
      return createdCaliber;
    } catch (error) {
      console.error("Failed to add new caliber:", error);
      throw error;
    }
  }

  async function handleEditCaliber(oldCaliber: string, newCaliber: string) {
    await editCaliberAction(oldCaliber, newCaliber);
    setCalibers((prev) => prev.map((c) => (c === oldCaliber ? newCaliber : c)).sort());
  }

  async function handleDeleteCaliber(caliberToDelete: string) {
    await deleteCaliberAction(caliberToDelete);
    setCalibers((prev) => prev.filter((c) => c !== caliberToDelete));
  }

  async function handleAddNewCategory(categoryName: string) {
    try {
      const createdCategory = await addNewCategoryAction(categoryName);
      setCategories((prev) => [...prev, createdCategory].sort());
      return createdCategory;
    } catch (error) {
      console.error("Failed to add new category:", error);
      throw error;
    }
  }

  async function handleEditCategory(oldCategory: string, newCategory: string) {
    await editCategoryAction(oldCategory, newCategory);
    setCategories((prev) => prev.map((c) => (c === oldCategory ? newCategory : c)).sort());
  }

  async function handleDeleteCategory(categoryToDelete: string) {
    await deleteCategoryAction(categoryToDelete);
    setCategories((prev) => prev.filter((c) => c !== categoryToDelete));
  }

  const startDeleteCountdown = () => {
    setDeleteCountdown(5);
    let count = 5;
    
    deleteTimerRef.current = setInterval(async () => {
      count -= 1;
      setDeleteCountdown(count);
      
      if (count <= 0) {
        if (deleteTimerRef.current) {
          clearInterval(deleteTimerRef.current);
          deleteTimerRef.current = null;
        }
        setDeleteCountdown(null);
        
        try {
          setPending(true);
          await deleteProductAction(product.id);
          setShowConfirmDelete(false);
          router.refresh();
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Failed to delete product");
          setShowConfirmDelete(false);
        } finally {
          setPending(false);
        }
      }
    }, 1000);
  };

  const cancelDelete = () => {
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setDeleteCountdown(null);
    setShowConfirmDelete(false);
  };

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

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: ManageablePhoto[] = Array.from(files).map((file, idx) => ({
        url: URL.createObjectURL(file),
        file,
        isPrimary: false,
        position: photos.length + idx,
      }));

      const updated = [...photos, ...newPhotos];
      if (!updated.some((p) => p.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      setPhotos(updated.map((p, idx) => ({ ...p, position: idx })));
    }
    if (e.target) e.target.value = "";
  };

  const triggerReplace = (index: number) => {
    setReplacingIndex(index);
    setTimeout(() => {
      replaceInputRef.current?.click();
    }, 50);
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replacingIndex !== null) {
      const url = URL.createObjectURL(file);
      setPhotos((prev) =>
        prev.map((p, idx) =>
          idx === replacingIndex
            ? { ...p, file, url, id: undefined } // Remove id so it gets treated as a new upload
            : p
        )
      );
    }
    if (e.target) e.target.value = "";
    setReplacingIndex(null);
  };

  const handleDeletePhoto = (index: number) => {
    const photoToDelete = photos[index];
    const updated = photos.filter((_, idx) => idx !== index);
    const finalPhotos = updated.map((p, idx) => ({ ...p, position: idx }));
    if (photoToDelete.isPrimary && finalPhotos.length > 0) {
      finalPhotos[0].isPrimary = true;
    }
    setPhotos(finalPhotos);
  };

  const handleMakePrimary = (index: number) => {
    setPhotos((prev) =>
      prev.map((p, idx) => ({
        ...p,
        isPrimary: idx === index,
      }))
    );
  };

  const handlePositionChange = (targetIndex: number, newPos1Based: number) => {
    if (isNaN(newPos1Based) || newPos1Based < 1) return;
    const newIndex = Math.max(0, Math.min(photos.length - 1, newPos1Based - 1));
    const updated = [...photos];
    const [removed] = updated.splice(targetIndex, 1);
    updated.splice(newIndex, 0, removed);
    setPhotos(updated.map((p, idx) => ({ ...p, position: idx })));
  };

  function openDialog() {
    loadProducts();
    setSelectedRelatedIds(product.relatedProducts?.map((p) => p.id) || []);
    
    // Initialize unified photos state
    const sortedPhotos = [...product.photos]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((p, idx) => ({
        id: p.id,
        url: p.url,
        isPrimary: p.isPrimary,
        position: idx
      }));
    setPhotos(sortedPhotos);
    dialogRef.current?.showModal();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    // Remove the default photos input since we are manually sending files
    formData.delete("photos");

    // Sort photos by position
    const sortedPhotos = [...photos].sort((a, b) => a.position - b.position);

    // Append files and build photoMeta mapping
    const photoMeta: Array<{ id?: string; tempIndex?: number; isPrimary: boolean; position: number }> = [];
    let tempIndex = 0;

    sortedPhotos.forEach((p, idx) => {
      if (p.id) {
        // existing photo
        photoMeta.push({
          id: p.id,
          isPrimary: p.isPrimary,
          position: idx,
        });
      } else if (p.file) {
        // new photo file
        formData.append("photos", p.file);
        photoMeta.push({
          tempIndex: tempIndex++,
          isPrimary: p.isPrimary,
          position: idx,
        });
      }
    });

    formData.append("photoMeta", JSON.stringify(photoMeta));

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
          {primaryPhoto ? (
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
            <div><span className="text-gray-500 dark:text-gray-400">Price:</span> ₹{product.price.toFixed(2)}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Qty:</span> {product.quantity}</div>
            <div><span className="text-gray-500 dark:text-gray-400">License:</span> {product.licenseRequired ? "Required" : "No"}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Brand:</span> {product.brands?.map(b => b.name).join(", ") || "—"}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Type:</span> {product.types?.map(t => t.name).join(", ") || "—"}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Caliber:</span> {product.calibers?.map(c => c.name).join(", ") || "—"}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Category:</span> {product.categories?.map(c => c.name).join(", ") || "—"}</div>
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
              disabled={deleteCountdown !== null}
              className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:bg-red-800 disabled:opacity-85"
              onClick={startDeleteCountdown}
            >
              {deleteCountdown !== null ? `Deleting in ${deleteCountdown}s...` : "Confirm Delete"}
            </button>
            <button
              className="px-3 py-1.5 rounded border text-sm bg-[#111] text-white hover:bg-[#222] transition-colors"
              onClick={cancelDelete}
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
            
            {/* Custom Photo Management Component */}
            <div className="md:col-span-2 space-y-4">
              <span className="text-sm font-medium text-gray-400 block">Manage Product Images</span>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-[#111] rounded-lg border border-[#333]">
                  {photos.map((photo, idx) => (
                    <div key={idx} className={`relative flex flex-col items-center p-2 rounded-lg border bg-[#222] ${photo.isPrimary ? 'border-red-600' : 'border-[#444]'}`}>
                      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-black flex items-center justify-center mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt={`preview ${idx}`} className="object-contain w-full h-full" />
                        {photo.isPrimary && (
                          <span className="absolute top-1 left-1 bg-red-600 text-[10px] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Primary</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between w-full mb-2 px-1">
                        <span className="text-xs text-gray-400">Order:</span>
                        <input
                          type="number"
                          min={1}
                          max={photos.length}
                          value={photo.position + 1}
                          onChange={(e) => handlePositionChange(idx, parseInt(e.target.value))}
                          className="w-12 text-center text-xs bg-[#111] text-white border border-[#444] rounded py-0.5"
                        />
                      </div>

                      <div className="flex gap-1.5 justify-center w-full mt-auto">
                        <button type="button" onClick={() => triggerReplace(idx)} className="flex-1 py-1 rounded bg-[#333] hover:bg-[#444] text-[11px] font-semibold text-white transition-colors">Replace</button>
                        <button type="button" onClick={() => handleDeletePhoto(idx)} className="px-2 py-1 rounded bg-red-950 hover:bg-red-800 text-white text-[11px] transition-colors" title="Delete">✕</button>
                      </div>

                      {!photo.isPrimary && (
                        <button type="button" onClick={() => handleMakePrimary(idx)} className="text-[10px] text-gray-400 hover:text-red-500 underline mt-1.5 transition-colors">Make Primary</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Images inputs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-dashed border-[#444] hover:border-red-500 bg-[#111] text-sm text-gray-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Picture</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddPhotos}
                  className="hidden"
                />
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReplaceFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Name</span>
              <input name="name" defaultValue={product.name} className="border rounded px-2 py-1.5 bg-[#111]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Price</span>
              <input name="price" type="number" step="0.01" defaultValue={product.price} className="border rounded px-2 py-1.5 bg-[#111]" />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm text-gray-600">Description</span>
              <textarea name="description" defaultValue={product.description} className="border rounded px-2 py-1.5 min-h-24 bg-[#111]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Quantity</span>
              <input name="quantity" type="number" defaultValue={product.quantity} className="border rounded px-2 py-1.5 bg-[#111]" />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input name="licenseRequired" type="checkbox" defaultChecked={product.licenseRequired} />
              <span className="text-sm text-gray-700">License Required</span>
            </label>
            <ManageableAutocompleteInput
              name="tag"
              label="Tag"
              placeholder="e.g., NEW, TOP_SELLER"
              defaultValue={product.tag ?? ""}
              options={tags}
              onAddNew={handleAddNewTag}
              onEdit={handleEditTag}
              onDelete={handleDeleteTag}
              textTransform="uppercase"
              multiSelect={true}
            />
            <ManageableAutocompleteInput
              name="brandName"
              label="Brand Name"
              placeholder="e.g., Glock, Precihole"
              defaultValue={product.brands?.map(b => b.name).join(", ") || ""}
              options={brands}
              onAddNew={handleAddNewBrand}
              onEdit={handleEditBrand}
              onDelete={handleDeleteBrand}
            />
            <ManageableAutocompleteInput
              name="typeName"
              label="Type Name"
              placeholder="e.g., Pistol, Rifle"
              defaultValue={product.types?.map(t => t.name).join(", ") || ""}
              options={types}
              onAddNew={handleAddNewType}
              onEdit={handleEditType}
              onDelete={handleDeleteType}
            />
            <ManageableAutocompleteInput
              name="caliberName"
              label="Caliber Name"
              placeholder="e.g., 9mm, .45 ACP"
              defaultValue={product.calibers?.map(c => c.name).join(", ") || ""}
              options={calibers}
              onAddNew={handleAddNewCaliber}
              onEdit={handleEditCaliber}
              onDelete={handleDeleteCaliber}
            />
            <ManageableAutocompleteInput
              name="categoryName"
              label="Category Name"
              placeholder="e.g., Handgun, Scope"
              defaultValue={product.categories?.map(c => c.name).join(", ") || ""}
              options={categories}
              onAddNew={handleAddNewCategory}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
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
            <button type="button" onClick={() => dialogRef.current?.close()} className="px-3 py-1.5 rounded border text-sm bg-[#111] text-white hover:bg-[#333] transition-colors border-gray-300 dark:border-[#333]">Cancel</button>
            <button type="submit" disabled={pending} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm border border-red-600 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {pending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="9" className="opacity-25" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                  <span>Targeting...</span>
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
