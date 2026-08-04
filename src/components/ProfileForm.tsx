"use client";

import { useMemo, useState } from "react";

export type ProfileFormValues = {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  alternatePhone: string;
};

export type ProfileFormProps = {
  initialValues?: Partial<ProfileFormValues>;
  submitting?: boolean;
  onSubmit: (values: ProfileFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

const blankValues = {
  fullName: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  alternatePhone: "",
};

function validate(values: ProfileFormValues) {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!/^\+?[0-9]{10,12}$/.test(values.phoneNumber.replace(/\s+/g, ""))) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (!values.addressLine1.trim()) {
    errors.addressLine1 = "Address line 1 is required.";
  }

  if (!values.city.trim()) {
    errors.city = "City is required.";
  }

  if (!values.state.trim()) {
    errors.state = "State is required.";
  }

  if (!values.country.trim()) {
    errors.country = "Country is required.";
  }

  if (!values.postalCode.trim()) {
    errors.postalCode = "Postal code is required.";
  } else if (!/^[A-Za-z0-9\-\s]{3,10}$/.test(values.postalCode.trim())) {
    errors.postalCode = "Enter a valid postal code.";
  }

  return errors;
}

export default function ProfileForm({
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
  submitLabel = "Save profile",
}: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>({
    ...blankValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});

  const fieldClassName = useMemo(
    () => "w-full rounded-2xl border border-gray-700 bg-[#111111] px-3 py-2.5 text-sm text-white shadow-sm outline-none transition focus:border-red-500",
    []
  );

  const handleChange = (field: keyof ProfileFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-200">Full Name</label>
          <input value={values.fullName} onChange={(e) => handleChange("fullName", e.target.value)} className={fieldClassName} placeholder="Jane Doe" />
          {errors.fullName ? <p className="mt-1 text-sm text-red-400">{errors.fullName}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-200">Phone Number</label>
          <input value={values.phoneNumber} onChange={(e) => handleChange("phoneNumber", e.target.value)} className={fieldClassName} placeholder="9876543210" />
          {errors.phoneNumber ? <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-200">Alternate Phone</label>
          <input value={values.alternatePhone} onChange={(e) => handleChange("alternatePhone", e.target.value)} className={fieldClassName} placeholder="Optional" />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-200">Address Line 1</label>
          <input value={values.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} className={fieldClassName} placeholder="House / Flat / Building" />
          {errors.addressLine1 ? <p className="mt-1 text-sm text-red-400">{errors.addressLine1}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-200">Address Line 2</label>
          <input value={values.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} className={fieldClassName} placeholder="Street / Area / Locality" />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-200">Landmark</label>
          <input value={values.landmark} onChange={(e) => handleChange("landmark", e.target.value)} className={fieldClassName} placeholder="Optional" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-200">City</label>
          <input value={values.city} onChange={(e) => handleChange("city", e.target.value)} className={fieldClassName} placeholder="Mumbai" />
          {errors.city ? <p className="mt-1 text-sm text-red-400">{errors.city}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-200">State</label>
          <input value={values.state} onChange={(e) => handleChange("state", e.target.value)} className={fieldClassName} placeholder="Maharashtra" />
          {errors.state ? <p className="mt-1 text-sm text-red-400">{errors.state}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-200">Country</label>
          <input value={values.country} onChange={(e) => handleChange("country", e.target.value)} className={fieldClassName} placeholder="India" />
          {errors.country ? <p className="mt-1 text-sm text-red-400">{errors.country}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-200">Postal Code</label>
          <input value={values.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} className={fieldClassName} placeholder="400001" />
          {errors.postalCode ? <p className="mt-1 text-sm text-red-400">{errors.postalCode}</p> : null}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-800 pt-4 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-2xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gray-800">
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={submitting} className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
