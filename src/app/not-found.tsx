import Link from "next/link";
import { Crosshair } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <Crosshair className="w-24 h-24 text-red-500 animate-pulse" strokeWidth={1.5} />
        <div className="absolute inset-0 w-24 h-24 border border-red-500/20 rounded-full animate-ping pointer-events-none" />
      </div>
      
      <h1 className="text-4xl sm:text-5xl font-black tracking-widest uppercase mb-4 text-white">
        Not Available
      </h1>
      
      <p className="text-gray-400 max-w-md text-sm sm:text-base mb-8 leading-relaxed">
        The target page could not be locked on. It might have been relocated, removed, or is temporarily out of range.
      </p>
      
      <Link 
        href="/"
        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wider uppercase rounded-md border border-red-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
      >
        Return to Base (Home)
      </Link>
    </div>
  );
}
