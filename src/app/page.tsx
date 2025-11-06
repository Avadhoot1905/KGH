import './LP.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import Link from 'next/link';
import { Target, Crosshair, Package, Eye, AlertCircle } from 'lucide-react'; // icons

export default function Home() {
  const categories = [
    { name: 'HANDGUNS', sub: '120+ Models', icon: <Target size={40} color="#e63946" /> },
    { name: 'RIFLES', sub: '85+ Models', icon: <Crosshair size={40} color="#e63946" /> },
    { name: 'AMMUNITION', sub: '500+ Types', icon: <Package size={40} color="#e63946" /> },
    { name: 'ACCESSORIES', sub: '300+ Items', icon: <Eye size={40} color="#e63946" /> },
    { name: 'TACTICAL', sub: '150+ Tools', icon: <AlertCircle size={40} color="#e63946" /> },
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
            <div key={i} className="card">
              <div className="icon">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p>{cat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="products">
        <h2>FEATURED PRODUCTS</h2>
        <div className="product-grid">
          {airgunProducts.length > 0 ? (
            airgunProducts.map((product) => (
              <Link 
                key={product.id} 
                href={`/ProductDetail/${product.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="product-card">
                  {product.photos && product.photos.length > 0 && (
                    <div style={{ width: '100%', height: '150px', position: 'relative', marginBottom: '1rem' }}>
                      <Image
                        src={product.photos.find(p => p.isPrimary)?.url || product.photos[0].url}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                  <p style={{ color: '#ff3333', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ₹{product.price.toLocaleString()}
                  </p>
                  {product.averageRating && product.averageRating > 0 && (
                    <p style={{ color: '#ffd700', fontSize: '0.9rem' }}>
                      ⭐ {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
                    </p>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="product-card">
              <p>No airgun products available at the moment</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
