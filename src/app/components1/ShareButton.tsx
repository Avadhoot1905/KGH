"use client";

import { useState } from "react";
import { FaShareAlt, FaCheck } from "react-icons/fa";

type ShareButtonProps = {
  title: string;
  url: string;
  className?: string;
};

export default function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <button className={`share-detail-btn ${copied ? "copied" : ""}`} onClick={handleShare}>
      {copied ? (
        <>
          <FaCheck className="share-icon" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <FaShareAlt className="share-icon" />
          <span>Share Item</span>
        </>
      )}
    </button>
  );
}


