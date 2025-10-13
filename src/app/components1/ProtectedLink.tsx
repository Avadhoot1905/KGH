"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AuthPopup from "./AuthPopup";
import { getGoogleSignInUrl } from "@/actions/auth";

type ProtectedLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  requireAuth?: boolean;
  authTitle?: string;
  authMessage?: string;
};

export default function ProtectedLink({
  href,
  children,
  className,
  title,
  requireAuth = true,
  authTitle,
  authMessage,
}: ProtectedLinkProps) {
  const { data: session, status } = useSession();
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [googleSignInUrl, setGoogleSignInUrl] = useState("");

  useEffect(() => {
    if (showAuthPopup) {
      getGoogleSignInUrl(href).then(setGoogleSignInUrl);
    }
  }, [showAuthPopup, href]);

  const handleClick = (e: React.MouseEvent) => {
    if (requireAuth && status !== "loading" && !session?.user) {
      e.preventDefault();
      setShowAuthPopup(true);
    }
  };

  return (
    <>
      <Link
        href={href}
        className={className}
        title={title}
        onClick={handleClick}
      >
        {children}
      </Link>
      
      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        googleSignInUrl={googleSignInUrl}
        title={authTitle || "Sign in required"}
        message={authMessage || `Please sign in to access ${title || "this page"}.`}
      />
    </>
  );
}
