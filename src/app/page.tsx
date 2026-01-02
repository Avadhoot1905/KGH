import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { Target, Crosshair, Package, Eye } from 'lucide-react';

// Server-side check: log in terminal whether the hero images exist (runs only on server)
if (typeof window === 'undefined') {
  (async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const _heroPath = path.join(process.cwd(), 'public', 'photos', 'hero.png');
      const _hero1Path = path.join(process.cwd(), 'public', 'photos', 'hero1.png');

      if (fs.existsSync(_heroPath)) {
        console.log('✅ Desktop hero found at public/photos/hero.png');
      } else {
        console.warn('⚠️ Desktop hero NOT found at public/photos/hero.png');
      }

      if (fs.existsSync(_hero1Path)) {
        console.log('✅ Mobile hero found at public/photos/hero1.png');
      } else {
        console.warn('⚠️ Mobile hero NOT found at public/photos/hero1.png');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('⚠️ Could not verify hero images:', errMsg);
    }
  })();
}


import { getProducts } from '@/actions/products';
import type { PrismaClient } from '@prisma/client';

declare global {
  var __PRISMA__: PrismaClient | undefined;
}

export default async function Home() {
  // Fetch all categories to find "Air Guns" category ID
  const { PrismaClient } = await import('@prisma/client');
  let prisma;
  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
  } else {
    if (!global.__PRISMA__) {
      global.__PRISMA__ = new PrismaClient();
    }
    prisma = global.__PRISMA__;
  }
  
  const airgunsCategories = await prisma.category.findMany({
    where: {
      name: {
        contains: 'Air',
        mode: 'insensitive',
      },
    },
  });
  
  // Fetch products with the airgun category (limit to 4)
  const categoryIds = airgunsCategories.map((cat: { id: string }) => cat.id);
  const featuredProducts = await getProducts({
    filters: {
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    },
    page: 1,
    pageSize: 4,
  });
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
      <section className="relative w-full overflow-hidden flex flex-col lg:flex-row items-center justify-between px-6 lg:px-16 py-16 min-h-[420px]">
        {/* Full-width background banner (place your hero at /public/photos/hero.jpg) */}
        <Image
          src="/photos/hero.png"
          alt="Hero banner"
          fill
          className="absolute inset-0 z-0 w-full h-full object-cover object-center"
          style={{ outline: '3px dashed #7CFC00', outlineOffset: '4px', filter: 'brightness(1.05) contrast(1.02)' }}
          priority
        />

        {/* Dark overlay for readability (temporarily reduced for debugging) */}
        <div className="absolute inset-0 bg-black/10 z-10" />

        {/* Content sits above the banner like a profile box */}
        <div className="relative z-20 max-w-xl w-full lg:w-1/2 mx-auto lg:mx-0">
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            <span>PRECISION.</span><br />
            <span className="text-red-500">POWER.</span><br />
            LEGACY.
          </h1>

          <p className="text-gray-300 mt-4">
            Premium firearms and tactical gear for the discerning professional
          </p>

          <div className="flex flex-wrap gap-4 mt-6">
            <Link href="/Shop">
              <button className="bg-red-500 hover:bg-red-600 px-6 py-3 font-semibold rounded">
                SHOP NOW
              </button>
            </Link>

            <a
              href="https://www.youtube.com/@kathuriagunhousearmsammuna4618"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="bg-white text-black px-6 py-3 font-semibold rounded hover:bg-gray-200">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={i}
                href={`/Shop?category=${encodeURIComponent(cat.name)}`}
                className="w-full max-w-[180px]"
              >
                <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-md hover:shadow-red-500/40 transition transform hover:-translate-y-1">
                  <div className="flex justify-center mb-4">
                    <Icon size={38} className="text-red-500" />
                  </div>
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{cat.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="products">
        <h2>FEATURED PRODUCTS</h2>
        <div className="product-grid">
          {featuredProducts.items.length > 0 ? (
            featuredProducts.items.map((product) => (
              <Link key={product.id} href={`/ProductDetail/${product.id}`}>
                <div className="product-card">
                  {product.photos.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '200px', marginBottom: '10px' }}>
                      <Image 
                        src={product.photos.find(p => p.isPrimary)?.url || product.photos[0].url}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : null}
                  <h3>{product.name}</h3>
                  <p>₹{product.price.toLocaleString()}</p>
                </div>
              </Link>
            ))
          ) : (
            <p style={{ color: '#888' }}>No featured products available.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

