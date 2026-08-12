"use client";

import { useState } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

type Photo = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary?: boolean;
};

type ProductCardGalleryProps = {
  photos: Photo[];
  productName: string;
  aspectRatioClassName?: string;
  height?: string;
};

export default function ProductCardGallery({
  photos,
  productName,
  height = "200px",
}: ProductCardGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div
        className="w-full bg-[#111] rounded-lg flex items-center justify-center text-gray-500 text-sm"
        style={{ height }}
      >
        No Image
      </div>
    );
  }

  const activePhoto = photos[activeIndex] || photos[0];

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg group" style={{ height }}>
      <Image
        src={activePhoto.url}
        alt={activePhoto.alt ?? productName}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-contain p-2 transition-transform duration-300 hover:scale-105"
      />

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-650 transition opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none border border-white/10 z-10 cursor-pointer"
            aria-label="Previous photo"
          >
            <FaChevronLeft className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={handleNext}
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-650 transition opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none border border-white/10 z-10 cursor-pointer"
            aria-label="Next photo"
          >
            <FaChevronRight className="w-2.5 h-2.5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {photos.map((_, idx) => (
            <span
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === activeIndex ? "bg-red-600 scale-125 w-2.5" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
