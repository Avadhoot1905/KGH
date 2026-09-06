import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { Target, Crosshair, Package, Eye } from 'lucide-react';
import ProductCardGallery from '@/app/components1/ProductCardGallery';

// Server-side check: log in terminal whether the hero images exist (runs only on server)
async function checkHeroImageImports() {
  try {
    await import('fs');
    await import('path');
  } catch (err) {
    console.error('Hero image check failed:', err instanceof Error ? err.message : String(err));
  }
}

if (typeof window === 'undefined') {
  void checkHeroImageImports();
}


import { getProducts } from '@/actions/products';
import type { PaginatedProducts } from '@/actions/products';
import { getHomeTestimonials } from '@/actions/feedbackAndReturns';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

export default async function Home() {
  let featuredProducts: PaginatedProducts = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 4,
    totalPages: 0
  };
  let testimonials: Array<{ id: string; content: string; userName: string }> = [];

  try {
    const [fetchedTestimonials, airgunsCategories] = await Promise.all([
      getHomeTestimonials(),
      prisma.category.findMany({
        where: { name: { contains: 'Air', mode: 'insensitive' } },
        select: { id: true },
      }),
    ]);

    testimonials = fetchedTestimonials;
    const categoryIds = airgunsCategories.map((cat: { id: string }) => cat.id);

    featuredProducts = await getProducts({
      filters: {
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      },
      page: 1,
      pageSize: 4,
    });
  } catch (error) {
    console.warn('Failed to load homepage data:', error instanceof Error ? error.message : String(error));
  }
  const categories = [
    { name: 'Air Guns', sub: 'Precision & Power', icon: Target },
    { name: 'Ammunition', sub: '500+ Types', icon: Package },
    { name: 'Accessories', sub: '300+ Items', icon: Eye },
    { name: 'Firearms', sub: '120+ Models', icon: Crosshair }
//    { name: 'Tactical', sub: '150+ Tools', icon: AlertCircle },
  ];

  return (
    <div className="bg-[#0f0f0f] text-white min-h-screen">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden flex flex-col lg:flex-row items-center lg:items-start justify-between px-6 md:px-12 lg:px-16 py-16 min-h-[420px] text-center lg:text-left">
        {/* Full-width background banner (place your hero at /public/photos/hero.jpg) */}
        <Image
          src="/photos/hero.png"
          alt="Hero banner"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="absolute inset-0 z-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(1.05) contrast(1.02)' }}
        />

        {/* Dark overlay for readability (temporarily reduced for debugging) */}
        <div className="absolute inset-0 bg-black/10 z-10" />

        {/* Content sits above the banner like a profile box */}
        <div className="relative z-20 max-w-xl w-full lg:w-1/2 mx-auto lg:mx-0">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            <span>PRECISION.</span><br />
            <span className="text-red-500">POWER.</span><br />
            LEGACY.
          </h1>

          <p className="text-gray-300 mt-4">
            Premium firearms and tactical gear for the discerning professional
          </p>

          <div className="flex flex-wrap gap-4 mt-6">
            <Link href="/Shop">
              <button suppressHydrationWarning className="bg-red-500 hover:bg-red-600 px-6 py-3 font-semibold rounded">
                SHOP NOW
              </button>
            </Link>

            <a
              href="https://www.youtube.com/@kathuriagunhousearmsammuna4618"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button suppressHydrationWarning className="bg-white text-black px-6 py-3 font-semibold rounded hover:bg-gray-200">
                Visit our Youtube Channel
              </button>
            </a>
          </div>
        </div>

      </section>

      {/* FEATURED CATEGORIES */}
      <section className="px-6 lg:px-16 py-14 text-center">
        <h2 className="text-2xl font-semibold mb-8 tracking-wide">
          FEATURED CATEGORIES
        </h2>

        {/* 🔥 GRID FIX HERE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={i}
                href={`/Shop?category=${encodeURIComponent(cat.name)}`}
                className="w-full max-w-[260px] h-44 md:h-auto"
              >
                <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-md hover:shadow-red-500/40 transition transform hover:-translate-y-1 flex flex-col items-center justify-between h-full">
                  <div className="flex justify-center mb-4">
                    <Icon size={38} className="text-red-500" />
                  </div>
                  <h3 className="font-semibold text-lg text-center">{cat.name}</h3>
                  <p className="text-sm text-gray-400 mt-1 text-center">{cat.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="px-6 lg:px-16 py-14 text-center">
        <h2 className="text-2xl font-semibold mb-8 tracking-wide">
          FEATURED PRODUCTS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
          {featuredProducts.items.length > 0 ? (
            featuredProducts.items.map((product) => (
              <Link
                key={product.id}
                href={`/ProductDetail/${product.id}`}
                className="w-full max-w-[280px]"
              >
                <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-md hover:shadow-red-500/40 transition transform hover:-translate-y-1 flex flex-col justify-between h-full border border-white/5">
                  <div className="mb-4">
                    <ProductCardGallery photos={product.photos} productName={product.name} height="192px" />
                  </div>
                  <div className="text-left flex-grow flex flex-col justify-between">
                    <h3 className="font-semibold text-base tracking-wide truncate text-white mb-2" title={product.name}>
                      {product.name}
                    </h3>
                    <p className="text-red-500 font-bold text-lg mt-auto">
                      ₹{product.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 col-span-full">No featured products available.</p>
          )}
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      {testimonials.length > 0 && (
        <section className="px-6 lg:px-16 py-16 bg-[#121212] border-t border-white/5 text-center">
          <h2 className="text-2xl font-semibold mb-10 tracking-wide">
            TESTIMONIALS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto justify-items-center">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 shadow-md flex flex-col justify-between max-w-md w-full relative">
                {/* Quotation mark decoration */}
                <div className="absolute top-4 left-4 text-6xl text-white/5 font-serif select-none pointer-events-none">“</div>
                <p className="text-gray-300 italic text-sm leading-relaxed mb-6 pt-4 relative z-10 text-left">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="text-right">
                  <span className="text-red-500 font-semibold text-xs tracking-wider uppercase">— {t.userName}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

