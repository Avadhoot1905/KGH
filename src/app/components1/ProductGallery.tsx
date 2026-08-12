"use client";

import { useState } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

type Photo = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

type ProductGalleryProps = {
  photos: Photo[];
  productName: string;
};

export default function ProductGallery({ photos, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-neutral-900 rounded-3xl flex items-center justify-center text-gray-500 border border-neutral-800">
        No Image Available
      </div>
    );
  }

  const activePhoto = photos[activeIndex] || photos[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Image Container */}
      <div className="relative w-full h-[350px] sm:h-[450px] md:h-[500px] bg-neutral-950/65 rounded-3xl overflow-hidden border border-neutral-800 flex items-center justify-center group">
        <Image
          src={activePhoto.url}
          alt={activePhoto.alt ?? productName}
          fill
          priority
          className="object-contain p-4 transition-all duration-300"
        />

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none border border-white/10 z-10 cursor-pointer"
              aria-label="Previous image"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none border border-white/10 z-10 cursor-pointer"
              aria-label="Next image"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Counter Badge */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 font-medium">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnails Scroller */}
      {photos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-850">
          {photos.map((photo, index) => (
            <button
              key={photo.id || index}
              onClick={() => setActiveIndex(index)}
              type="button"
              className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-900 border-2 shrink-0 transition cursor-pointer ${
                index === activeIndex
                  ? "border-red-600 scale-95 shadow-md shadow-red-600/20"
                  : "border-neutral-800 hover:border-neutral-700 hover:scale-95"
              }`}
            >
              <Image
                src={photo.url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
