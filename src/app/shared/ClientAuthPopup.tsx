"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import AuthPopup from "../components1/AuthPopup";
import { getGoogleSignInUrl } from "@/actions/auth";

function ClientAuthPopupInner() {
  const [open, setOpen] = useState(false);
  const [googleUrl, setGoogleUrl] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      const redirectOverride = searchParams.get("redirect");
      const callbackPath = redirectOverride || pathname || "/";
      const url = await getGoogleSignInUrl(callbackPath);
      setGoogleUrl(url);
    })();
  }, [pathname, searchParams]);

  useEffect(() => {
    if (searchParams.get("authRequired") === "1") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [searchParams]);

  return (
    <AuthPopup
      isOpen={open}
      onClose={() => setOpen(false)}
      googleSignInUrl={googleUrl}
    />
  );
}

export default function ClientAuthPopup() {
  return (
    <Suspense fallback={null}>
      <ClientAuthPopupInner />
    </Suspense>
  );
}


