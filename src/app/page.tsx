import './LP.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import Link from 'next/link';
import { Target, Crosshair, Package, Eye, AlertCircle } from 'lucide-react'; // icons

export default function Home() {
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
          <div className="product-card">Glock 19 Gen4</div>
          <div className="product-card">AR-15 Tactical</div>
          <div className="product-card">Tactical Scope 4x32</div>
          <div className="product-card">New PUL Ammo</div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
