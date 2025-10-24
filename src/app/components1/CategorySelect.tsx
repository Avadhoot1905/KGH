"use client";

import { useState } from "react";
import { createCategory, type Category } from "@/actions/categories";

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  onCategoryCreated?: () => void;
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  onCategoryCreated,
}: CategorySelectProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError("Category name is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await createCategory(newCategoryName);
    setIsLoading(false);

    if (result.success && result.category) {
      onChange(result.category.id);
      setIsCreating(false);
      setNewCategoryName("");
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } else {
      setError(result.error || "Failed to create category");
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewCategoryName("");
    setError(null);
  };

  if (isCreating) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => {
              setNewCategoryName(e.target.value);
              setError(null);
            }}
            placeholder="Enter category name"
            className="flex-1 px-2 py-1.5 border rounded bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateCategory();
              }
              if (e.key === "Escape") {
                handleCancel();
              }
            }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            disabled={isLoading || !newCategoryName.trim()}
            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            {isLoading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
        {error && <div className="text-red-600 text-xs">{error}</div>}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__create__") {
          setIsCreating(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className="w-full px-2 py-1.5 border rounded bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]"
    >
      <option value="">Select a category</option>
      <option value="__create__" className="font-semibold text-green-600">
        + Create New Category
      </option>
      {categories.length > 0 && <option disabled>──────────</option>}
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
