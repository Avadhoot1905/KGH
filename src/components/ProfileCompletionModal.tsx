"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import ProfileForm, { type ProfileFormValues } from "@/components/ProfileForm";
import { getCurrentUserCheckoutDetails, saveCheckoutProfile } from "@/actions/profile";

export type ProfileCompletionModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  mode?: "create" | "edit";
};

export default function ProfileCompletionModal({ open, onClose, onSaved, mode }: ProfileCompletionModalProps) {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState<ProfileFormValues | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await getCurrentUserCheckoutDetails();
        if (!mounted) return;

        if (result.success && result.data) {
          setInitialValues({
            fullName: result.data.fullName ?? "",
            phoneNumber: result.data.phoneNumber ?? "",
            addressLine1: result.data.addressLine1 ?? "",
            addressLine2: result.data.addressLine2 ?? "",
            landmark: "",
            city: result.data.city ?? "",
            state: result.data.state ?? "",
            country: result.data.country ?? "",
            postalCode: result.data.pincode ?? "",
            alternatePhone: "",
          });
        } else {
          setInitialValues(undefined);
        }
      } catch {
        if (mounted) setError("We could not load your profile right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open]);

  const handleSubmit = async (values: ProfileFormValues) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await saveCheckoutProfile({
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        state: values.state,
        country: values.country,
        pincode: values.postalCode,
      });

      if (!result.success) {
        throw new Error(result.error || "Unable to save profile");
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const content = (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-3 py-6 backdrop-blur-sm">
        <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-gray-800 bg-[#0f0f0f] shadow-2xl shadow-black/50">
          <div className="flex items-start justify-between border-b border-gray-800 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-red-500">Profile</p>
              <h2 className="mt-1 text-xl font-semibold text-white">{mode === "edit" ? "Edit your profile" : "Complete your profile"}</h2>
              <p className="mt-2 text-sm text-gray-400">Add the details you need for a smoother checkout experience. You can finish this later.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-gray-700 p-2 text-gray-300 transition hover:bg-gray-800">
              ✕
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-400">Loading your profile…</div>
            ) : (
              <>
                {error ? <div className="mb-4 rounded-2xl border border-red-700/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</div> : null}
                {session?.user ? (
                  <div className="mb-4 rounded-2xl border border-gray-800 bg-[#121212] p-3 text-sm text-gray-400">
                    Logged in as <span className="font-medium text-white">{session.user.email}</span>
                  </div>
                ) : null}
                <ProfileForm initialValues={initialValues} submitting={submitting} onSubmit={handleSubmit} onCancel={onClose} submitLabel={mode === "edit" ? "Save changes" : "Save profile"} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
