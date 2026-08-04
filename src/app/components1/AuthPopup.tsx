"use client";

import React, { useState } from "react";
import "./AuthPopup.css";
import { signIn } from "next-auth/react";

type AuthPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
  title?: string;
  message?: string;
};

export default function AuthPopup({ 
  isOpen, 
  onClose, 
  callbackUrl = "/", 
  title = "Sign in required", 
  message = "Please sign in to continue." 
}: AuthPopupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-popup-overlay" onClick={onClose}>
      <div className="auth-popup" onClick={(e) => e.stopPropagation()}>
        <button className="auth-popup-close" aria-label="Close" onClick={onClose}>×</button>
        
        <div className="auth-popup-content">
          <div className="auth-popup-header">
            <div className="auth-icon">🔒</div>
            <h2>{title}</h2>
            <p className="auth-message">{message}</p>
          </div>

          {error && (
            <div className="auth-error-msg bg-red-600/10 border border-red-500/30 p-2.5 rounded text-red-500 text-xs mb-4 text-center">
              {error}
            </div>
          )}

          <div className="auth-popup-actions">
            {/* Google Sign In Option */}
            <button 
              type="button" 
              onClick={handleGoogleClick}
              disabled={loading}
              className="btn-google cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.8c2.65,0 4.87,-0.88 6.49,-2.4l-3.3,-2.6c-0.91,0.61 -2.08,0.98 -3.19,0.98 -2.46,0 -4.54,-1.66 -5.28,-3.9H3.34v2.7C4.96,18.78 8.27,20.8 12,20.8z" fill="#34A853" />
                  <path d="M6.72,12.88c-0.18,-0.55 -0.29,-1.13 -0.29,-1.73s0.11,-1.18 0.29,-1.73V6.75H3.34C2.73,7.97 2.38,9.35 2.38,10.8s0.35,2.83 0.96,4.05L6.72,12.88z" fill="#FBBC05" />
                  <path d="M12,5.63c1.44,0 2.73,0.5 3.75,1.47l2.8,-2.8C16.86,2.77 14.64,1.9 12,1.9 8.27,1.9 4.96,3.92 3.34,7.12l3.38,2.7C7.46,7.29 9.54,5.63 12,5.63z" fill="#EA4335" />
                </g>
              </svg>
              <span>{loading ? "Connecting..." : "Continue with Google"}</span>
            </button>

            <p className="auth-disclaimer">By continuing, you agree to our Terms and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
