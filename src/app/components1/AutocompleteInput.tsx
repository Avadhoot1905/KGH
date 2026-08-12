"use client";

import { useState, useRef, useEffect } from "react";

type AutocompleteInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options: string[];
  onLoadOptions?: () => void;
  className?: string;
};

export default function AutocompleteInput({
  name,
  label,
  placeholder,
  required = false,
  defaultValue = "",
  options,
  onLoadOptions,
  className = "",
}: AutocompleteInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (value.trim() === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [value, options]);

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
    setValue(option);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
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
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <label className={`flex flex-col gap-1 relative ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
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
        className="border rounded px-2 py-1.5 bg-white dark:bg-[#111] text-black dark:text-white border-gray-300 dark:border-[#333]"
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#111] border border-gray-300 dark:border-[#333] rounded shadow-lg z-50"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelectOption(option)}
              className={`px-3 py-2 cursor-pointer text-black dark:text-white text-sm ${
                index === highlightedIndex
                  ? "bg-red-600/20 text-red-500 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-[#222]"
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </label>
  );
}
