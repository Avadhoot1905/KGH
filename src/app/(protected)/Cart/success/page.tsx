'use client';

import Link from 'next/link';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0d0d0d] text-white px-4 py-16 flex items-center justify-center">
        <div className="max-w-xl rounded-xl border border-[#2a2a2a] bg-[#151515] p-8 text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="text-2xl font-semibold">Order received</h2>
          <p className="mt-3 text-sm text-gray-400">Your payment is being processed. We’ll confirm your order shortly and send you the details to your email.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/profile" className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">View Orders</Link>
            <Link href="/Shop" className="rounded-lg border border-[#333] px-4 py-2 text-sm text-gray-300">Continue Shopping</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
