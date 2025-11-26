import './LP.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import Link from 'next/link';
import { Target, Crosshair, Package, Eye, AlertCircle } from 'lucide-react'; // icons
import { getProducts } from '@/actions/products';
import Image from 'next/image';
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
    { name: 'Air Guns', sub: 'Precision & Power', icon: <Target size={40} color="#e63946" /> },
    { name: 'Ammunition', sub: '500+ Types', icon: <Package size={40} color="#e63946" /> },
    { name: 'Accessories', sub: '300+ Items', icon: <Eye size={40} color="#e63946" /> },
    { name: 'Firearms', sub: '120+ Models', icon: <Crosshair size={40} color="#e63946" /> },
    { name: 'Tactical', sub: '150+ Tools', icon: <AlertCircle size={40} color="#e63946" /> },
  ];

  return (
    <div className="landing">
      <Navbar />
      <section className="hero">
        <div className="hero-text">
          <h1>
            <span>PRECISION.</span><br/>
            <span className="highlight">POWER.</span><br/>
            LEGACY.
          </h1>
          <p>Premium firearms and tactical gear for the discerning professional</p>
          <div className="buttons">
            <Link href="/Shop">
              <button className="red">SHOP NOW</button>
            </Link>
            <a
              href="https://www.youtube.com/@kathuriagunhousearmsammuna4618"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="white">Visit our Youtube Channel</button>
            </a>
          </div>
        </div>
        <div className="gun-img"></div>
      </section>

      <section className="categories">
        <h2>FEATURED CATEGORIES</h2>
        <div className="category-cards">
          {categories.map((cat, i) => (
            <Link key={i} href={`/Shop?category=${encodeURIComponent(cat.name)}`}>
              <div className="card">
                <div className="icon">{cat.icon}</div>
                <h3>{cat.name}</h3>
                <p>{cat.sub}</p>
              </div>
            </Link>
          ))}
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
