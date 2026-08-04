"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d0d] text-white">
      <div className="relative flex flex-col items-center gap-6">
        {/* Sleek Target Crosshair Spinner */}
        <div className="relative w-20 h-20">
          <svg
            className="animate-spin w-full h-full text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" className="opacity-20" />
            <circle cx="12" cy="12" r="5" strokeDasharray="3 3" className="opacity-60" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </div>
        
        {/* Text */}
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-xl font-semibold tracking-wider uppercase text-white animate-pulse">
            Loading...
          </h2>
          <p className="text-xs text-gray-500 tracking-widest uppercase">
            Kathuria Gun House
          </p>
        </div>
      </div>
    </div>
  );
}
