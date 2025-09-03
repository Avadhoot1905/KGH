import React from "react";
import "./shop.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";
import { getFilteredProducts } from "@/actions/products";

function formatINR(amount: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  }
}

export default async function Page() {
  const products = await getFilteredProducts();

  return (
    <div>
      <Navbar/>
      <div className="shop-page">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3>FILTERS</h3>

          <div className="filter-group">
            <strong>Brand</strong>
            <label>
              <input type="checkbox" /> Glock
            </label>
            <label>
              <input type="checkbox" /> Smith & Wesson
            </label>
            <label>
              <input type="checkbox" /> Sig Sauer
            </label>
          </div>

          <div className="filter-group">
            <strong>Type</strong>
            <button className="pill">Pistol</button>
            <button className="pill">Rifle</button>
            <button className="pill">Shotgun</button>
          </div>

          <div className="filter-group">
            <strong>Price Range</strong>
            <input type="text" placeholder="Min" />
            <input type="text" placeholder="Max" />
          </div>

          <div className="filter-group">
            <strong>Sort By</strong>
            <select>
              <option>Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* Content */}
        <main className="content">
          <h2>FIREARMS COLLECTION</h2>

          <div className="product-grid">
            {products.map((product) => {
              const primaryPhoto = product.photos.find((p) => p.isPrimary) ?? product.photos[0];
              const subtitle = `${product.caliber.name}, ${product.type.name}`;
              return (
                <div key={product.id} className="product-card">
                  {product.tag && (
                    <span className={`tag ${product.tag === "NEW" ? "new" : "top"}`}>
                      {product.tag}
                    </span>
                  )}
                  {primaryPhoto ? (
                    <img src={primaryPhoto.url} alt={primaryPhoto.alt ?? product.name} />
                  ) : (
                    <div style={{ height: 180 }} />
                  )}
                  <h4>{product.name}</h4>
                  <p>{subtitle}</p>
                  <h3>{formatINR(product.price)}</h3>
                  <button className="add-to-cart">ADD TO CART</button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="active">1</span>
            <span>2</span>
            <span>3</span>
            <span>...</span>
            <span>7</span>
          </div>
        </main>
      </div>
      <Footer/>
    </div>
  );
}
