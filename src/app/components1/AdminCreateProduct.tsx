"use client";

import { useRef, useState, FormEvent } from "react";
import { 
  createProductAction, 
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
import RelatedProductsSelector from "./RelatedProductsSelector";
import ManageableAutocompleteInput from "./ManageableAutocompleteInput";

type AdminCreateProductProps = {
  buttonClassName?: string;
};

type ManageablePhoto = {
  url: string;
  file?: File;
  isPrimary: boolean;
  position: number;
};

export default function AdminCreateProduct({ buttonClassName }: AdminCreateProductProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [calibers, setCalibers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Custom photos state management
  const [photos, setPhotos] = useState<ManageablePhoto[]>([]);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

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

  async function loadOptions() {
    if (!loadingOptions && (brands.length === 0 || types.length === 0 || calibers.length === 0 || categories.length === 0 || tags.length === 0)) {
      setLoadingOptions(true);
      try {
        const [brandsData, typesData, calibersData, categoriesData, tagsData] = await Promise.all([
          getAllBrandsForSelector(),
          getAllTypesForSelector(),
          getAllCalibersForSelector(),
          getAllCategoriesForSelector(),
          getAllTagsForSelector(),
        ]);
        setBrands(brandsData);
        setTypes(typesData);
        setCalibers(calibersData);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (e) {
        console.error("Failed to load options", e);
      } finally {
        setLoadingOptions(false);
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
            ? { ...p, file, url }
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

  async function handleAddNewTag(tagName: string) {
    try {
      const normalizedTag = await addNewTagAction(tagName);
      setTags((prev) => [...prev, normalizedTag].sort());
      return normalizedTag;
    } catch (error) {
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

  function openDialog() {
    setError(null);
    setSelectedRelatedIds([]);
    setPhotos([]);
    loadProducts();
    loadOptions();
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
    const photoMeta: Array<{ tempIndex: number; isPrimary: boolean; position: number }> = [];
    let tempIndex = 0;

    sortedPhotos.forEach((p, idx) => {
      if (p.file) {
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
      await createProductAction(formData);
      dialogRef.current?.close();
      form.reset();
      setPhotos([]);
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setPending(false);
    }
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
            
            {/* Custom Photo Management Component */}
            <div className="md:col-span-2 space-y-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 block">Product Images (optional, multiple allowed)</span>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-[#111] rounded-lg border border-gray-200 dark:border-[#333]">
                  {photos.map((photo, idx) => (
                    <div key={idx} className={`relative flex flex-col items-center p-2 rounded-lg border bg-white dark:bg-[#222] ${photo.isPrimary ? 'border-red-600 dark:border-red-600' : 'border-gray-200 dark:border-[#444]'}`}>
                      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-black flex items-center justify-center mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt={`preview ${idx}`} className="object-contain w-full h-full" />
                        {photo.isPrimary && (
                          <span className="absolute top-1 left-1 bg-red-600 text-[10px] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Primary</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between w-full mb-2 px-1">
                        <span className="text-xs text-gray-500">Order:</span>
                        <input
                          type="number"
                          min={1}
                          max={photos.length}
                          value={photo.position + 1}
                          onChange={(e) => handlePositionChange(idx, parseInt(e.target.value))}
                          className="w-12 text-center text-xs bg-gray-100 dark:bg-[#111] text-black dark:text-white border border-gray-300 dark:border-[#444] rounded py-0.5"
                        />
                      </div>

                      <div className="flex gap-1.5 justify-center w-full mt-auto">
                        <button type="button" onClick={() => triggerReplace(idx)} className="flex-1 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-[#333] dark:hover:bg-[#444] text-[11px] font-semibold text-black dark:text-white transition-colors">Replace</button>
                        <button type="button" onClick={() => handleDeletePhoto(idx)} className="px-2 py-1 rounded bg-red-950 hover:bg-red-800 text-white text-[11px] transition-colors" title="Delete">✕</button>
                      </div>

                      {!photo.isPrimary && (
                        <button type="button" onClick={() => handleMakePrimary(idx)} className="text-[10px] text-gray-500 hover:text-red-500 underline mt-1.5 transition-colors">Make Primary</button>
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
                  className="px-4 py-2 border border-dashed border-gray-300 dark:border-[#444] hover:border-red-500 dark:hover:border-red-500 bg-white dark:bg-[#111] text-sm text-gray-700 dark:text-gray-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
            <ManageableAutocompleteInput
              name="tag"
              label="Tag"
              placeholder="e.g., NEW, TOP_SELLER"
              options={tags}
              onAddNew={handleAddNewTag}
              onEdit={handleEditTag}
              onDelete={handleDeleteTag}
              textTransform="uppercase"
            />
            <ManageableAutocompleteInput
              name="brandName"
              label="Brand Name"
              placeholder="e.g., Glock, Precihole"
              required
              options={brands}
              onLoadOptions={loadOptions}
              onAddNew={handleAddNewBrand}
              onEdit={handleEditBrand}
              onDelete={handleDeleteBrand}
            />
            <ManageableAutocompleteInput
              name="typeName"
              label="Type Name"
              placeholder="e.g., Pistol, Rifle"
              required
              options={types}
              onLoadOptions={loadOptions}
              onAddNew={handleAddNewType}
              onEdit={handleEditType}
              onDelete={handleDeleteType}
            />
            <ManageableAutocompleteInput
              name="caliberName"
              label="Caliber Name"
              placeholder="e.g., 9mm, .45 ACP"
              required
              options={calibers}
              onLoadOptions={loadOptions}
              onAddNew={handleAddNewCaliber}
              onEdit={handleEditCaliber}
              onDelete={handleDeleteCaliber}
            />
            <ManageableAutocompleteInput
              name="categoryName"
              label="Category Name"
              placeholder="e.g., Handgun, Scope"
              required
              options={categories}
              onLoadOptions={loadOptions}
              onAddNew={handleAddNewCategory}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
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
                "Create"
              )}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
