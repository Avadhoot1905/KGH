"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, type CurrentUser } from "@/actions/auth";

export function useProfileCompletion() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    const data = await getCurrentUser();
    setUser(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const data = await getCurrentUser();
      if (mounted) {
        setUser(data);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const profileComplete = useMemo(() => {
    if (!user) return false;
    return Boolean(
      user.profileCompleted ||
      (user.name && user.phoneNumber && user.addressLine1 && user.city && user.state && user.country && user.postalCode)
    );
  }, [user]);

  return {
    user,
    loading,
    profileComplete,
    profileIncomplete: !profileComplete,
    refreshProfile,
  };
}
