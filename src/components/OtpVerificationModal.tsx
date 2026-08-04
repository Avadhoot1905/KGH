"use client";

import { useEffect, useState, useCallback } from "react";
import { sendOtp, verifyOtp } from "@/actions/otp";

type OtpVerificationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  phoneNumber: string;
  onVerifySuccess: () => void;
};

export default function OtpVerificationModal({
  isOpen,
  onClose,
  email,
  phoneNumber,
  onVerifySuccess,
}: OtpVerificationModalProps) {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [inputEmailCode, setInputEmailCode] = useState("");
  const [inputPhoneCode, setInputPhoneCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOtp = useCallback(async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    setInputEmailCode("");
    setInputPhoneCode("");

    try {
      await sendOtp(email, phoneNumber);
      setSuccess("Verification codes have been sent to your email and phone.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please check your config.");
    } finally {
      setSending(false);
    }
  }, [email, phoneNumber]);

  // Trigger real OTP dispatch on open
  useEffect(() => {
    if (isOpen && email && phoneNumber) {
      void handleSendOtp();
    }
  }, [isOpen, email, phoneNumber, handleSendOtp]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setVerifying(true);

    try {
      if (inputEmailCode.length !== 4 || inputPhoneCode.length !== 4) {
        throw new Error("Please enter valid 4-digit codes.");
      }

      await verifyOtp(email, phoneNumber, inputEmailCode, inputPhoneCode);
      onVerifySuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Check your codes.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-[4px] px-4 animate-fade-in">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-slide-up">
        <button 
          className="absolute top-4 right-4 bg-none border-none text-[#aaa] hover:text-white hover:bg-[#333] transition-all text-xl w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          onClick={onClose}
          disabled={sending || verifying}
        >
          ×
        </button>

        <div className="text-center mb-6">
          <span className="text-3xl">📱</span>
          <h3 className="text-xl font-bold text-white mt-2">Security Verification</h3>
          <p className="text-xs text-gray-400 mt-1">Please enter the OTP codes sent to your email and mobile number.</p>
        </div>

        {error && (
          <div className="bg-red-600/10 border border-red-500/30 p-2.5 rounded text-red-500 text-xs mb-4 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-600/10 border border-green-500/30 p-2.5 rounded text-green-500 text-xs mb-4 text-center">
            {success}
          </div>
        )}

        {sending ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <svg className="animate-spin w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" className="opacity-20" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            <p className="text-xs text-gray-400 font-medium">Sending verification codes...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {/* Email verification input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Email OTP ({email})</label>
              <input
                type="text"
                placeholder="Enter 4-digit Email code"
                value={inputEmailCode}
                onChange={(e) => setInputEmailCode(e.target.value.trim())}
                maxLength={4}
                className="w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm text-center tracking-widest font-mono focus:outline-none focus:border-red-500"
                required
              />
            </div>

            {/* Phone verification input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Phone OTP ({phoneNumber})</label>
              <input
                type="text"
                placeholder="Enter 4-digit Phone code"
                value={inputPhoneCode}
                onChange={(e) => setInputPhoneCode(e.target.value.trim())}
                maxLength={4}
                className="w-full bg-[#252525] border border-[#333] rounded-lg p-2.5 text-white text-sm text-center tracking-widest font-mono focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={verifying}
                className="flex-grow py-2.5 rounded-lg bg-[#222] border border-white/10 hover:bg-[#333] text-gray-300 text-sm font-semibold transition-all cursor-pointer text-center"
              >
                Resend OTP
              </button>

              <button
                type="submit"
                disabled={verifying}
                className="flex-grow py-2.5 rounded-lg text-white font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center text-sm"
                style={{
                  background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
                  border: "none",
                }}
              >
                {verifying ? "Verifying..." : "Verify & Proceed"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
