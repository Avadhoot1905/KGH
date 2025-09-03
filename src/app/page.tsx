
import './LP.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import Link from 'next/link';
export default function Home() {
  return (
    <div className="landing">
      <Navbar />
      <section className="hero">
        <div className="hero-text">
          <h1><span>PRECISION.</span><br/><span className="highlight">POWER.</span><br/>LEGACY.</h1>
          <p>Premium firearms and tactical gear for the discerning professional</p>
          <div className="buttons">
           <Link href="/Shop"> <button className="red">SHOP NOW</button></Link>
           <Link href="/ProductDetail"> <button className="white">BROWSE CATEGORIES</button></Link>
          </div>
        </div>
        <div className="gun-img"></div>
      </section>

      <section className="filters">
        <select><option>All Brands</option></select>
        <select><option>All Types</option></select>
        <select><option>All Caliber</option></select>
      </section>

      <section className="categories">
        <h2>FEATURED CATEGORIES</h2>
        <div className="category-cards">
          {['HANDGUNS', 'RIFLES', 'AMMUNITION', 'ACCESSORIES', 'TACTICAL'].map((cat, i) => (
            <div key={i} className="card">{cat}</div>
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

      <section className="testimonials">
        <h2>CUSTOMER TESTIMONIALS</h2>
        <div className="testimonial-grid">
          <div className="testimonial">&quot;Outstanding experience!&quot; - John Mikel</div>
          <div className="testimonial">&quot;High-end tactical gear.&quot; - Sarah Thompson</div>
          <div className="testimonial">&quot;Very satisfied!&quot; - Mike Rodriguez</div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
