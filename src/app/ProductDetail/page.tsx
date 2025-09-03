import React from "react";
import "./PD.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";

export default function ProductDetailPage() {
  return (
    <div>
      <Navbar />

      <div className="product-detail-page">
        <div className="breadcrumb">
          <a href="#">Home</a> &gt; <a href="#">Firearms</a> &gt; Glock 19 Gen 5
        </div>

        <div className="product-main">
          {/* Product Gallery */}
          <div className="product-gallery">
            <img
              className="main-image"
              src="/images/glock-19-main.png"
              alt="Glock 19 Gen 5"
            />
            <div className="thumbnail-row">
              <img src="/images/glock-19-thumb1.png" alt="Thumb1" />
              <img src="/images/glock-19-thumb2.png" alt="Thumb2" />
              <img src="/images/glock-19-thumb3.png" alt="Thumb3" />
              <img src="/images/glock-19-thumb4.png" alt="Thumb4" />
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="tags">
              <span className="tag green">Pistol</span>
              <span className="tag red">In Stock</span>
            </div>
            <h1 className="product-title">GLOCK 19 GEN 5</h1>
            <p className="rating">
              ★★★★★ <span>(127 reviews)</span>
            </p>
            <p className="price">$549.99</p>

            <div className="spec-box">
              <h3>SPECIFICATIONS</h3>
              <ul>
                <li>
                  <strong>Caliber:</strong> 9mm Luger
                </li>
                <li>
                  <strong>Capacity:</strong> 15+1 rounds
                </li>
                <li>
                  <strong>Barrel Length:</strong> 4.02&quot;
                </li>
                <li>
                  <strong>Overall Length:</strong> 7.28&quot;
                </li>
                <li>
                  <strong>Weight:</strong> 23.63 oz
                </li>
                <li>
                  <strong>Action:</strong> Striker Fire
                </li>
              </ul>
            </div>

            <div className="description">
              <h3>DESCRIPTION</h3>
              <p>
                The GLOCK 19 Gen5 pistol in 9mm Luger is ideal for a more
                versatile role due to its reduced dimensions. The Gen5 features
                over 20 design modifications including the GLOCK Marksman Barrel,
                nDLC finish, ambidextrous slide stop lever, and a flared
                mag-well.
              </p>
            </div>

            <div className="buttons">
              <button className="red">ADD TO CART</button>
              <button className="outline">❤️ Wishlist</button>
              <button className="outline">🔗 Share</button>
            </div>

            <div className="warning-box">
              <strong>Legal Requirements:</strong>
              <br />
              Valid FFL license required. Background check mandatory. Must be 21+
              years old. Local laws may apply.
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="related-products">
          <h2>RELATED PRODUCTS</h2>
          <div className="product-grid">
            <div className="product-card">
              <img src="/images/glock-17.png" alt="Glock 17 Gen 5" />
              <h4>Glock 17 Gen 5</h4>
              <p>9mm – 17+1 capacity</p>
              <p className="price">$589.00</p>
            </div>
            <div className="product-card">
              <img src="/images/holster.png" alt="Tactical Holster" />
              <h4>Tactical Holster</h4>
              <p>Glock 19 Compatible</p>
              <p className="price">$39.00</p>
            </div>
            <div className="product-card">
              <img src="/images/magazine.png" alt="Extra Magazine" />
              <h4>Extra Magazine</h4>
              <p>15-round capacity</p>
              <p className="price">$29.00</p>
            </div>
            <div className="product-card">
              <img src="/images/light.png" alt="Tactical Light" />
              <h4>Tactical Light</h4>
              <p>500 Lumens</p>
              <p className="price">$149.00</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
