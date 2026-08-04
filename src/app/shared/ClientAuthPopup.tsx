"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import AuthPopup from "../components1/AuthPopup";

function ClientAuthPopupInner() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("authRequired") === "1") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [searchParams]);

  const redirectOverride = searchParams.get("redirect");
  const callbackUrl = redirectOverride || pathname || "/";

  return (
    <AuthPopup
      isOpen={open}
      onClose={() => setOpen(false)}
      callbackUrl={callbackUrl}
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
