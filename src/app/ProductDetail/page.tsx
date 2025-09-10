import React from "react";
import "./PD.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";
import AddToCartButton from "../components1/AddToCartButton";
import WishlistButton from "../components1/WishlistButton";
import ShareButton from "../components1/ShareButton";
import { getProductById } from "@/actions/products";

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

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <main className="content" style={{ padding: 24 }}>
          <h2>Product not found</h2>
        </main>
        <Footer />
      </div>
    );
  }

  const primaryPhoto = product.photos.find((p) => p.isPrimary) ?? product.photos[0];

  return (
    <div>
      <Navbar />

      <div className="product-detail-page">
        <div className="breadcrumb">
          <a href="#">Home</a> &gt; <a href="#">{product.category.name}</a> &gt; {product.name}
        </div>

        <div className="product-main">
          {/* Product Gallery */}
          <div className="product-gallery">
            {primaryPhoto ? (
              <img className="main-image" src={primaryPhoto.url} alt={primaryPhoto.alt ?? product.name} />
            ) : null}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="tags">
              <span className="tag green">{product.type.name}</span>
              <span className="tag red">{product.quantity > 0 ? "In Stock" : "Out of Stock"}</span>
            </div>
            <h1 className="product-title">{product.name}</h1>
            <p className="rating">★★★★★ <span>({product.totalReviews} reviews)</span></p>
            <p className="price">{formatINR(product.price)}</p>

            <div className="spec-box">
              <h3>SPECIFICATIONS</h3>
              <ul>
                <li><strong>Caliber:</strong> {product.caliber.name}</li>
                <li><strong>Brand:</strong> {product.brand.name}</li>
                <li><strong>Type:</strong> {product.type.name}</li>
                <li><strong>License Required:</strong> {product.licenseRequired ? "Yes" : "No"}</li>
              </ul>
            </div>

            <div className="description">
              <h3>DESCRIPTION</h3>
              <p>{product.description}</p>
            </div>

            <div className="buttons">
              <AddToCartButton productId={product.id} />
              <WishlistButton productId={product.id} />
              <ShareButton title={product.name} url={`https://example.com/product/${product.id}`} />
            </div>

            <div className="warning-box">
              <strong>Legal Requirements:</strong>
              <br />
              Valid license may be required depending on item. Local laws apply.
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


