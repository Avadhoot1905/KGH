"use client";

import React, { useState } from "react";
import { Truck, MapPin, CheckCircle } from "lucide-react";

// North India state prefixes/keywords (Punjab, Delhi, Haryana, Himachal Pradesh, Chandigarh, J&K, Uttarakhand, Rajasthan)
const NORTH_PIN_PREFIXES = ["14", "15", "16", "11", "12", "13", "17", "18", "19", "30", "31", "32", "33", "34", "24", "25", "26", "27", "28"];

export default function DeliveryEstimator() {
  const [pincode, setPincode] = useState("");
  const [estimate, setEstimate] = useState<{ message: string; isNorth: boolean } | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (!cleanPin || cleanPin.length !== 6 || isNaN(Number(cleanPin))) {
      setEstimate({ message: "Please enter a valid 6-digit Indian Pincode", isNorth: false });
      return;
    }

    const prefix = cleanPin.slice(0, 2);
    const isNorth = NORTH_PIN_PREFIXES.includes(prefix);

    if (isNorth) {
      setEstimate({
        message: "Estimated Delivery: 3 - 4 Days (Dispatching from Malout, Punjab)",
        isNorth: true,
      });
    } else {
      setEstimate({
        message: "Estimated Delivery: 3 Weeks (Post-order processing for location far from Malout)",
        isNorth: false,
      });
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-[#181818] border border-gray-800 text-sm">
      <div className="flex items-center gap-2 text-red-500 font-semibold mb-2">
        <Truck className="w-4 h-4" />
        <span>Delivery Estimate</span>
      </div>
      <form onSubmit={handleCheck} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={pincode}
            maxLength={6}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Enter Pincode (e.g. 140001 or 110001)"
            className="w-full bg-[#111] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-red-600"
          />
        </div>
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors"
        >
          Check
        </button>
      </form>
      {estimate && (
        <div className={`mt-3 flex items-start gap-2 text-xs p-2.5 rounded-lg ${estimate.isNorth ? 'bg-green-950/40 text-green-400 border border-green-800/40' : 'bg-yellow-950/40 text-yellow-400 border border-yellow-800/40'}`}>
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{estimate.message}</span>
        </div>
      )}
      {!estimate && (
        <p className="text-[11px] text-gray-400 mt-2">
          📍 North India (Punjab, Delhi & NCR): 3-4 days • Other India regions: ~3 weeks from Malout headquarters.
        </p>
      )}
    </div>
  );
}
