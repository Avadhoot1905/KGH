"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

type ManageableAutocompleteInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options: string[];
  onAddNew?: (val: string) => Promise<unknown>;
  onEdit?: (oldVal: string, newVal: string) => Promise<unknown>;
  onDelete?: (val: string) => Promise<unknown>;
  onLoadOptions?: () => void;
  className?: string;
  textTransform?: "uppercase" | "none";
  multiSelect?: boolean;
};

export default function ManageableAutocompleteInput({
  name,
  label,
  placeholder,
  required = false,
  defaultValue = "",
  options,
  onAddNew,
  onEdit,
  onDelete,
  onLoadOptions,
  className = "",
  textTransform = "none",
  multiSelect = false,
}: ManageableAutocompleteInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [isNewOption, setIsNewOption] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const getActiveQuery = useCallback((val: string) => {
    if (!multiSelect) return val;
    const parts = val.split(",");
    return parts[parts.length - 1].trim();
  }, [multiSelect]);

  useEffect(() => {
    const activeQuery = getActiveQuery(value);
    const checkValue = textTransform === "uppercase" ? activeQuery.toUpperCase().replace(/\s+/g, "_") : activeQuery;
    
    if (checkValue.trim() === "") {
      setFilteredOptions(options);
      setIsNewOption(false);
    } else {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(checkValue.toLowerCase())
      );
      setFilteredOptions(filtered);

      const exactMatch = options.some(
        (opt) => opt.toLowerCase() === checkValue.toLowerCase()
      );
      setIsNewOption(!exactMatch && checkValue.length > 0);
    }
  }, [value, options, textTransform, multiSelect, getActiveQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    if (onLoadOptions) {
      onLoadOptions();
    }
    setShowDropdown(true);
  };

  const handleSelectOption = (option: string) => {
    if (multiSelect) {
      const parts = value.split(",").map((p) => p.trim());
      parts[parts.length - 1] = option;
      const newValue = parts.filter(Boolean).join(", ") + ", ";
      setValue(newValue);
    } else {
      setValue(option);
    }
    setShowDropdown(false);
    setIsNewOption(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleAddNew = async () => {
    const activeQuery = getActiveQuery(value);
    let finalValue = activeQuery.trim();
    if (textTransform === "uppercase") {
      finalValue = finalValue.toUpperCase().replace(/\s+/g, "_");
    }
    if (!finalValue || !onAddNew) return;

    // Check if the option exists with same spelling (case-insensitive)
    const exists = options.some(opt => opt.toLowerCase() === finalValue.toLowerCase() || opt.toLowerCase() === activeQuery.trim().toLowerCase());
    if (exists) {
      const confirmAdd = window.confirm(`"${finalValue}" already exists. Are you sure you want to add/create this option again?`);
      if (!confirmAdd) return;
    }

    setIsProcessing(true);
    try {
      await onAddNew(finalValue);
      if (multiSelect) {
        const parts = value.split(",").map((p) => p.trim());
        parts[parts.length - 1] = finalValue;
        setValue(parts.filter(Boolean).join(", ") + ", ");
      } else {
        setValue(finalValue);
      }
      setIsNewOption(false);
      setShowDropdown(false);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to add.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onEdit) return;

    const newName = prompt(`Rename "${option}" to:`, option);
    if (!newName || newName.trim() === "" || newName.trim() === option) return;

    let finalNewName = newName.trim();
    if (textTransform === "uppercase") {
      finalNewName = finalNewName.toUpperCase().replace(/\s+/g, "_");
    }

    setIsProcessing(true);
    try {
      await onEdit(option, finalNewName);
      if (value === option) {
        setValue(finalNewName);
      }
      if (onLoadOptions) onLoadOptions();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to edit.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;

    if (!confirm(`Are you sure you want to delete "${option}"?`)) return;

    setIsProcessing(true);
    try {
      await onDelete(option);
      if (value === option) {
        setValue("");
      }
      if (onLoadOptions) onLoadOptions();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to delete.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setShowDropdown(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (isNewOption && onAddNew) {
        void handleAddNew();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <label className={`flex flex-col gap-1 relative ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333] flex-1 pr-10"
        />
        {isNewOption && onAddNew && (
          <button
            type="button"
            onClick={handleAddNew}
            disabled={isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={`Add new ${label.toLowerCase()}`}
          >
            {isProcessing ? "..." : "+"}
          </button>
        )}
      </div>

      {showDropdown && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#111] border border-gray-300 dark:border-[#333] rounded shadow-lg z-50"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className={`px-3 py-2 cursor-pointer text-black dark:text-white text-sm flex items-center justify-between ${
                index === highlightedIndex
                  ? "bg-red-600/20 text-red-500 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-[#222]"
              }`}
              onClick={() => handleSelectOption(option)}
            >
              <span>{option}</span>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    type="button"
                    title="Edit"
                    onClick={(e) => handleEdit(option, e)}
                    className="p-1 hover:text-blue-500 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                  >
                    <FiEdit2 size={12} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => handleDelete(option, e)}
                    className="p-1 hover:text-red-500 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                  >
                    <FiTrash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isNewOption && onAddNew && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded p-2 text-xs text-amber-800 dark:text-amber-200 z-40">
          <strong>&quot;{getActiveQuery(value).trim()}&quot;</strong> is new. Click the <strong>+</strong> button or press Enter to add it.
        </div>
      )}
    </label>
  );
}
