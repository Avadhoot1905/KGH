"use client";

import React, { useState } from "react";
import "./AuthPopup.css";
import { signIn } from "next-auth/react";
import { registerCredentialsUser } from "@/actions/auth";
import OtpVerificationModal from "@/components/OtpVerificationModal";

type AuthPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  googleSignInUrl: string;
  title?: string;
  message?: string;
};

export default function AuthPopup({ 
  isOpen, 
  onClose, 
  googleSignInUrl, 
  title = "Sign in required", 
  message = "Please sign in to continue." 
}: AuthPopupProps) {
  const [view, setView] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields.");
      }

      const res = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error || "Invalid email or password");
      }

      onClose();
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.name || !formData.email || !formData.phoneNumber || !formData.password || !formData.confirmPassword) {
        throw new Error("All fields are mandatory.");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      // Step 1: Open the OTP modal to verify email and phone number
      setLoading(false);
      setShowOtpModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const executeRegistration = async () => {
    setShowOtpModal(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await registerCredentialsUser({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });

      setSuccess("Account registered successfully! Logging you in...");
      
      // Auto login after registration
      const loginRes = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (loginRes?.error) {
        throw new Error("Registration succeeded but auto-login failed. Please sign in manually.");
      }

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    let callbackUrl = "/";
    try {
      const url = new URL(googleSignInUrl);
      callbackUrl = url.searchParams.get("callbackUrl") || "/";
    } catch {}
    // Call NextAuth signin directly which bypasses NextAuth's internal selection page
    signIn("google", { callbackUrl });
  };

  return (
    <>
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

            {success && (
              <div className="auth-success-msg bg-green-600/10 border border-green-500/30 p-2.5 rounded text-green-500 text-xs mb-4 text-center">
                {success}
              </div>
            )}

            <div className="auth-popup-actions">
              {/* Google Sign In Option */}
              <button 
                type="button" 
                onClick={handleGoogleClick}
                className="btn-google cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                    <path d="M12,20.8c2.65,0 4.87,-0.88 6.49,-2.4l-3.3,-2.6c-0.91,0.61 -2.08,0.98 -3.19,0.98 -2.46,0 -4.54,-1.66 -5.28,-3.9H3.34v2.7C4.96,18.78 8.27,20.8 12,20.8z" fill="#34A853" />
                    <path d="M6.72,12.88c-0.18,-0.55 -0.29,-1.13 -0.29,-1.73s0.11,-1.18 0.29,-1.73V6.75H3.34C2.73,7.97 2.38,9.35 2.38,10.8s0.35,2.83 0.96,4.05L6.72,12.88z" fill="#FBBC05" />
                    <path d="M12,5.63c1.44,0 2.73,0.5 3.75,1.47l2.8,-2.8C16.86,2.77 14.64,1.9 12,1.9 8.27,1.9 4.96,3.92 3.34,7.12l3.38,2.7C7.46,7.29 9.54,5.63 12,5.63z" fill="#EA4335" />
                  </g>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* OR Divider */}
              <div className="flex items-center gap-2 my-2 text-xs text-gray-500 uppercase select-none">
                <span className="h-px bg-white/10 flex-grow"></span>
                <span>OR</span>
                <span className="h-px bg-white/10 flex-grow"></span>
              </div>

              {/* Email/Password Forms */}
              {view === "login" ? (
                <form onSubmit={handleLoginSubmit} className="auth-form space-y-3">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="auth-input w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg text-white font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center text-sm"
                    style={{
                      background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
                      border: "none",
                    }}
                  >
                    {loading ? "Signing In..." : "Sign In with Password"}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Don&apos;t have an account?{" "}
                    <span 
                      onClick={() => setView("register")} 
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      Register here
                    </span>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="auth-form space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="auth-input w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="auth-input w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="auth-input w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="auth-input w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-[#d32f2f]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg text-white font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center text-sm"
                    style={{
                      background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
                      border: "none",
                    }}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Already have an account?{" "}
                    <span 
                      onClick={() => setView("login")} 
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      Login here
                    </span>
                  </p>
                </form>
              )}

              <p className="auth-disclaimer">By continuing, you agree to our Terms and Privacy Policy.</p>
            </div>
          </div>
        </div>
      </div>

      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={formData.email}
        phoneNumber={formData.phoneNumber}
        onVerifySuccess={executeRegistration}
      />
    </>
  );
}
