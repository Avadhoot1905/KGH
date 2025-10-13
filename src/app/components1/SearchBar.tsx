"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { getSearchIndex } from "@/actions/products";

type SearchIndexItem = {
  id: string;
  name: string;
  description?: string | null;
  brandName?: string | null;
  typeName?: string | null;
  categoryName?: string | null;
  photoUrl?: string | null;
  price?: number | null;
};

type Props = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
};

export default function SearchBar({ className, inputClassName, placeholder = "Search products..." }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [autoText, setAutoText] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getSearchIndex();
        if (active) setIndex(data as SearchIndexItem[]);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(index, {
      includeScore: true,
      threshold: 0.35,
      keys: [
        "name",
        "description",
        "brandName",
        "typeName",
        "categoryName",
      ],
    });
  }, [index]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setAutoText("");
      return;
    }
    debounceTimer.current = setTimeout(() => {
      const search = fuse.search(query).slice(0, 8).map(r => r.item);
      setResults(search);
      setIsOpen(search.length > 0);
      setHighlightIndex(0);
      setAutoText(search[0]?.name ?? "");
    }, 2000);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, fuse]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  function goToProduct(p: SearchIndexItem) {
    setIsOpen(false);
    setQuery("");
    router.push(`/ProductDetail/${p.id}`);
  }

  function submitSearch() {
    const q = query.trim();
    if (!q) return;
    setIsOpen(false);
    router.push(`/Shop?q=${encodeURIComponent(q)}`);
  }

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setAutoText("");
  };

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", minWidth: 260 }}>
      <div style={{ position: "relative" }}>
        {/* Search Icon */}
        <svg
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 16,
            height: 16,
            color: "#6b7280",
            pointerEvents: "none",
            zIndex: 1,
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Autocomplete Hint */}
        {autoText && query && autoText.toLowerCase().startsWith(query.toLowerCase()) && (
          <input
            aria-hidden
            tabIndex={-1}
            readOnly
            value={autoText}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              color: "#4b5563",
              pointerEvents: "none",
              background: "transparent",
              border: "1px solid transparent",
              paddingLeft: 36,
              paddingRight: query ? 32 : 12,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 4,
            }}
          />
        )}

        {/* Main Input */}
        <input
          className={inputClassName}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(e) => {
            setIsOpen(results.length > 0);
            e.target.style.borderColor = "#dc2626";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#333";
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (results[highlightIndex]) {
                goToProduct(results[highlightIndex]);
              } else {
                submitSearch();
              }
            } else if (e.key === "Tab") {
              if (autoText) {
                e.preventDefault();
                setQuery(autoText);
              }
            }
          }}
          style={{
            width: "100%",
            paddingLeft: 36,
            paddingRight: query ? 32 : 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 4,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: "bold",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#dc2626"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 4,
            zIndex: 50,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          {results.map((p, idx) => (
            <div
              key={p.id}
              role="option"
              aria-selected={idx === highlightIndex}
              onMouseEnter={() => setHighlightIndex(idx)}
              onClick={() => goToProduct(p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                cursor: "pointer",
                background: idx === highlightIndex ? "#2a2a2a" : "transparent",
                color: "#fff",
                transition: "background-color 0.15s",
                borderBottom: idx < results.length - 1 ? "1px solid #333" : "none",
              }}
            >
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={p.photoUrl} 
                  alt={p.name} 
                  width={40} 
                  height={40} 
                  style={{ 
                    objectFit: "cover", 
                    borderRadius: 4,
                    flexShrink: 0,
                  }} 
                />
              ) : (
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 4, 
                  background: "#333",
                  flexShrink: 0,
                }} />
              )}
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                flex: 1,
                minWidth: 0,
              }}>
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>{p.name}</span>
                <span style={{ 
                  fontSize: 12, 
                  color: "#9ca3af",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {[p.brandName, p.typeName, p.categoryName].filter(Boolean).join(" · ")}
                </span>
              </div>
              {typeof p.price === "number" && (
                <span style={{ 
                  marginLeft: "auto", 
                  fontSize: 13, 
                  color: "#e5e7eb",
                  fontWeight: 500,
                  flexShrink: 0,
                }}>
                  ₹{Number(p.price).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


