"use client";

import React from "react";
import "./AuthPopup.css";

type AuthPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  googleSignInUrl: string;
  title?: string;
  message?: string;
};

export default function AuthPopup({ isOpen, onClose, googleSignInUrl, title = "Sign in required", message = "Please sign in with Google to continue." }: AuthPopupProps) {
  if (!isOpen) return null;

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
          <div className="auth-popup-actions">
            <a className="btn-google" href={googleSignInUrl}>
              <span>Continue with Google</span>
            </a>
            <p className="auth-disclaimer">By continuing, you agree to our Terms and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


