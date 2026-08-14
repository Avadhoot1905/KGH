import React from "react";
import "./PD.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";
import AddToCartButton from "../components1/AddToCartButton";
import WishlistButton from "../components1/WishlistButton";
import ShareButton from "../components1/ShareButton";
import ProductGallery from "../components1/ProductGallery";
import { getProductById, getRelatedProductsWithDetails } from "@/actions/products";
import Link from "next/link";
import Image from "next/image";

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

  const relatedProducts = await getRelatedProductsWithDetails(id);

  return (
    <div>
      <Navbar />

      <div className="product-detail-page">
        <div className="breadcrumb">
          <Link href="/">Home</Link> &gt; {product.categories.length > 0 && product.categories.map(c => c.name).filter(Boolean).length > 0 ? (
            <>
              <Link href={`/Shop?category=${encodeURIComponent(product.categories[0].name)}`}>
                {product.categories.map(c => c.name).filter(Boolean).join(", ")}
              </Link> &gt;{" "}
            </>
          ) : null}{product.name}
        </div>

        <div className="product-main">
          {/* Product Gallery */}
          <div className="product-gallery">
            <ProductGallery photos={product.photos} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="tags">
              {product.tag && product.tag.split(",").map((t) => t.trim()).filter(Boolean).map((t, idx) => (
                <span key={idx} className="tag red">{t}</span>
              ))}
              {product.types && product.types.map(t => t.name).filter(Boolean).join(", ") ? (
                <span className="tag green">{product.types.map(t => t.name).filter(Boolean).join(", ")}</span>
              ) : null}
              <span className="tag red">{product.quantity > 0 ? "In Stock" : "Out of Stock"}</span>
            </div>
            <h1 className="product-title">{product.name}</h1>
            <p className="rating">★★★★★ <span>({product.totalReviews} reviews)</span></p>
            <p className="price">{formatINR(product.price)}</p>

            <div className="spec-box">
              <h3>SPECIFICATIONS</h3>
              <ul>
                <li><strong>Caliber:</strong> {product.calibers.map(c => c.name).join(", ")}</li>
                <li><strong>Brand:</strong> {product.brands.map(b => b.name).join(", ")}</li>
                <li><strong>Type:</strong> {product.types.map(t => t.name).join(", ")}</li>
                <li><strong>License Required:</strong> {product.licenseRequired ? "Yes" : "No"}</li>
              </ul>
            </div>

            <div className="description">
              <h3>DESCRIPTION</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{product.description}</p>
            </div>

            <div className="buttons">
              <AddToCartButton productId={product.id} licenseRequired={product.licenseRequired} productQuantity={product.quantity} />
              <WishlistButton productId={product.id} />
              <ShareButton title={product.name} url={`https://buyairgunsindia.in/ProductDetail/${product.id}`} />
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
                        <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                          <Image src={relatedPrimaryPhoto.url} alt={relatedPrimaryPhoto.alt ?? relatedProduct.name} fill style={{ objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '150px', background: '#333', borderRadius: '8px' }} />
                      )}
                      <h4>{relatedProduct.name}</h4>
                      <p>{relatedProduct.brands.map(b => b.name).join(", ")} • {relatedProduct.types.map(t => t.name).join(", ")}</p>
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


