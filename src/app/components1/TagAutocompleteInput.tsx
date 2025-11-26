"use client";

import { useState, useRef, useEffect } from "react";

type TagAutocompleteInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  availableTags: string[];
  onAddNewTag?: (tag: string) => Promise<void>;
  className?: string;
};

export default function TagAutocompleteInput({
  name,
  label,
  placeholder,
  defaultValue = "",
  availableTags,
  onAddNewTag,
  className = "",
}: TagAutocompleteInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [isNewTag, setIsNewTag] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const trimmedValue = value.trim().toUpperCase();
    
    if (trimmedValue === "") {
      setFilteredOptions(availableTags);
      setIsNewTag(false);
    } else {
      const filtered = availableTags.filter((option) =>
        option.toUpperCase().includes(trimmedValue)
      );
      setFilteredOptions(filtered);
      
      // Check if the exact value exists in available tags
      const exactMatch = availableTags.some(
        (tag) => tag.toUpperCase() === trimmedValue
      );
      setIsNewTag(!exactMatch && trimmedValue.length > 0);
    }
  }, [value, availableTags]);

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
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleSelectOption = (option: string) => {
    setValue(option);
    setShowDropdown(false);
    setIsNewTag(false);
    inputRef.current?.focus();
  };

  const handleAddNewTag = async () => {
    const trimmedValue = value.trim().toUpperCase().replace(/\s+/g, "_");
    if (!trimmedValue || !onAddNewTag) return;
    
    setIsAdding(true);
    try {
      await onAddNewTag(trimmedValue);
      setValue(trimmedValue);
      setIsNewTag(false);
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to add new tag:", error);
      alert("Failed to add new tag. Please try again.");
    } finally {
      setIsAdding(false);
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
          placeholder={placeholder}
          autoComplete="off"
          className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333] flex-1 pr-10"
        />
        {isNewTag && onAddNewTag && (
          <button
            type="button"
            onClick={handleAddNewTag}
            disabled={isAdding}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Add new tag"
          >
            {isAdding ? "..." : "+"}
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
              onClick={() => handleSelectOption(option)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#222] text-black dark:text-white text-sm"
            >
              {option}
            </div>
          ))}
        </div>
      )}
      {isNewTag && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded p-2 text-xs text-amber-800 dark:text-amber-200 z-40">
          <strong>&quot;{value.trim().toUpperCase().replace(/\s+/g, "_")}&quot;</strong> is a new tag. Click the <strong>+</strong> button to add it.
        </div>
      )}
    </label>
  );
}
