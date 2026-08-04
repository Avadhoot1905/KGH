"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AuthPopup from "./AuthPopup";

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
        callbackUrl={href}
        title={authTitle || "Sign in required"}
        message={authMessage || `Please sign in to access ${title || "this page"}.`}
      />
    </>
  );
}
