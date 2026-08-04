"use client";

import { useState } from "react";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";

export type FinishProfileButtonProps = {
  profileIncomplete?: boolean;
  onCompleted?: () => void;
};

export default function FinishProfileButton({ profileIncomplete = true, onCompleted }: FinishProfileButtonProps) {
  const [open, setOpen] = useState(false);

  if (!profileIncomplete) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        Finish My Profile
      </button>
      <ProfileCompletionModal open={open} onClose={() => setOpen(false)} onSaved={onCompleted} />
    </>
  );
}
