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

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", minWidth: 260 }}>
      <div style={{ position: "relative", background: "#111827", border: "1px solid #374151", borderRadius: 4 }}>
        {autoText && query && autoText.toLowerCase().startsWith(query.toLowerCase()) && (
          <input
            aria-hidden
            tabIndex={-1}
            readOnly
            value={autoText}
            style={{
              position: "absolute",
              inset: 0,
              color: "#6b7280",
              pointerEvents: "none",
              background: "transparent",
              border: "1px solid transparent",
              padding: 6,
            }}
          />
        )}
        <input
          className={inputClassName}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(results.length > 0)}
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
          style={{ padding: 6, borderRadius: 4, border: "1px solid transparent", width: "100%", background: "transparent", color: "#fff" }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#111827",
            border: "1px solid #374151",
            borderTop: "none",
            zIndex: 50,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
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
                gap: 10,
                padding: "8px 10px",
                cursor: "pointer",
                background: idx === highlightIndex ? "#1f2937" : "#111827",
                color: "#fff",
              }}
            >
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt={p.name} width={36} height={36} style={{ objectFit: "cover", borderRadius: 4 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 4, background: "#374151" }} />
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{p.name}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {[p.brandName, p.typeName, p.categoryName].filter(Boolean).join(" · ")}
                </span>
              </div>
              {typeof p.price === "number" && (
                <span style={{ marginLeft: "auto", fontSize: 13, color: "#e5e7eb" }}>
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


