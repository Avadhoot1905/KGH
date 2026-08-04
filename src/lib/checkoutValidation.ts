export type CheckoutFormValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export function validateCheckoutDetails(values: CheckoutFormValues) {
  const errors: string[] = [];
  const requiredFields: Array<keyof CheckoutFormValues> = [
    "fullName",
    "email",
    "phoneNumber",
    "addressLine1",
    "city",
    "state",
    "country",
    "pincode",
  ];

  requiredFields.forEach((field) => {
    const value = values[field]?.toString().trim() ?? "";
    if (!value) {
      errors.push(`${field === "fullName" ? "Full name" : field === "phoneNumber" ? "Phone number" : field === "addressLine1" ? "Address line 1" : field === "pincode" ? "Pincode" : field.charAt(0).toUpperCase() + field.slice(1)} is required.`);
    }
  });

  const email = values.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Please enter a valid email address.");
  }

  const phone = values.phoneNumber.replace(/\D/g, "");
  if (phone && !/^\d{10}$/.test(phone)) {
    errors.push("Please enter a valid 10-digit phone number.");
  }

  const pincode = values.pincode.replace(/\D/g, "");
  if (pincode && !/^\d{4,8}$/.test(pincode)) {
    errors.push("Please enter a valid pincode.");
  }

  return errors;
}

export function buildAddressSummary(values: CheckoutFormValues) {
  return [values.addressLine1, values.addressLine2].filter(Boolean).join(", ");
}
