'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import { getCurrentUserCheckoutDetails, saveCheckoutProfile, type CheckoutProfileInput } from '@/actions/profile';
import { buildAddressSummary, validateCheckoutDetails, type CheckoutFormValues } from '@/lib/checkoutValidation';

const blankValues: CheckoutFormValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
};

export default function CheckoutDetailsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formValues, setFormValues] = useState<CheckoutFormValues>(blankValues);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }

    if (status !== 'authenticated') return;

    let mounted = true;
    (async () => {
      try {
        const result = await getCurrentUserCheckoutDetails();
        if (mounted && result.success && result.data) {
          setFormValues({
            fullName: result.data.fullName ?? '',
            email: result.data.email ?? session.user?.email ?? '',
            phoneNumber: result.data.phoneNumber ?? '',
            addressLine1: result.data.addressLine1 ?? '',
            addressLine2: result.data.addressLine2 ?? '',
            city: result.data.city ?? '',
            state: result.data.state ?? '',
            country: result.data.country ?? '',
            pincode: result.data.pincode ?? '',
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, session?.user?.email, status]);

  const handleChange = (field: keyof CheckoutFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCheckoutDetails(formValues);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSaving(true);
      setErrors([]);
      const payload: CheckoutProfileInput = {
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        phoneNumber: formValues.phoneNumber.trim(),
        addressLine1: formValues.addressLine1.trim(),
        addressLine2: formValues.addressLine2.trim(),
        city: formValues.city.trim(),
        state: formValues.state.trim(),
        country: formValues.country.trim(),
        pincode: formValues.pincode.trim(),
      };
      const result = await saveCheckoutProfile(payload);
      if (result.success) {
        router.push('/Cart?step=payment');
        return;
      }
      setErrors([result.error ?? 'Unable to save your details.']);
    } catch {
      setErrors(['Unable to save your details.']);
    } finally {
      setIsSaving(false);
    }
  };

  const summary = useMemo(() => buildAddressSummary(formValues), [formValues]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0d0d0d] text-white px-4 py-8 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Checkout Details</h2>
            <p className="text-sm text-gray-400 mt-2">Please review your shipping details before we continue to secure payment.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={handleSubmit} className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-6 space-y-4">
              {errors.length > 0 && (
                <div className="rounded-lg border border-red-600/40 bg-red-950/30 p-3 text-sm text-red-200">
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((error) => <li key={error}>{error}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">Full Name</span>
                  <input value={formValues.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">Email</span>
                  <input type="email" value={formValues.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">Phone Number</span>
                  <input value={formValues.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">Address Line 1</span>
                  <input value={formValues.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">Address Line 2 (optional)</span>
                  <input value={formValues.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">City</span>
                  <input value={formValues.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">State</span>
                  <input value={formValues.state} onChange={(e) => handleChange('state', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">Country</span>
                  <input value={formValues.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-gray-300">
                  <span className="mb-1 block">Pincode</span>
                  <input value={formValues.pincode} onChange={(e) => handleChange('pincode', e.target.value)} className="w-full rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2 text-white" />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" disabled={isSaving || loading} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Continue to Payment'}
                </button>
                <button type="button" onClick={() => router.push('/Cart')} className="rounded-lg border border-[#333] px-4 py-2 text-sm text-gray-300">Back to Cart</button>
              </div>
            </form>

            <aside className="rounded-xl border border-[#2a2a2a] bg-[#151515] p-6 space-y-4">
              <h3 className="text-lg font-semibold">Shipping Preview</h3>
              <p className="text-sm text-gray-400">We’ll use these details for your order and payment confirmation.</p>
              <div className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-4 text-sm text-gray-300 space-y-2">
                <p><span className="text-gray-500">Name:</span> {formValues.fullName || '—'}</p>
                <p><span className="text-gray-500">Email:</span> {formValues.email || '—'}</p>
                <p><span className="text-gray-500">Phone:</span> {formValues.phoneNumber || '—'}</p>
                <p><span className="text-gray-500">Address:</span> {summary || '—'}</p>
                <p><span className="text-gray-500">City / State:</span> {formValues.city || '—'}{formValues.city && formValues.state ? `, ${formValues.state}` : ''}</p>
                <p><span className="text-gray-500">Country / Pincode:</span> {formValues.country || '—'}{formValues.country && formValues.pincode ? ` / ${formValues.pincode}` : ''}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
