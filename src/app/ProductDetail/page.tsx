import React from "react";
import "./PD.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";
import AddToCartButton from "../components1/AddToCartButton";
import WishlistButton from "../components1/WishlistButton";
import ShareButton from "../components1/ShareButton";
import { getProductById, getRelatedProductsWithDetails } from "@/actions/products";
import Link from "next/link";

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
  const relatedProducts = await getRelatedProductsWithDetails(id);

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

      {/* Featured Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="product-detail-page">
          <div className="related-products">
            <h2>FEATURED PRODUCTS</h2>
            <div className="product-grid">
              {relatedProducts.map((relatedProduct) => {
                const relatedPrimaryPhoto = relatedProduct.photos.find((p) => p.isPrimary) ?? relatedProduct.photos[0];
                return (
                  <Link href={`/ProductDetail/${relatedProduct.id}`} key={relatedProduct.id} style={{ textDecoration: 'none' }}>
                    <div className="product-card">
                      {relatedPrimaryPhoto ? (
                        <img src={relatedPrimaryPhoto.url} alt={relatedPrimaryPhoto.alt ?? relatedProduct.name} />
                      ) : (
                        <div style={{ width: '100%', height: '150px', background: '#333', borderRadius: '8px' }} />
                      )}
                      <h4>{relatedProduct.name}</h4>
                      <p>{relatedProduct.brand.name} • {relatedProduct.type.name}</p>
                      <p className="price">{formatINR(relatedProduct.price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}


