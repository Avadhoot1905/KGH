import React from "react";
import "./shop.css";
import Navbar from "../components1/Navbar";
import Footer from "../components1/Footer";
import Filters from "./Filters";
import { getProducts, getFilterOptions, type ProductListItem } from "@/actions/products";
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

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const brandsParam = typeof sp.brands === "string" ? sp.brands : Array.isArray(sp.brands) ? sp.brands.join(",") : "";
  const typesParam = typeof sp.types === "string" ? sp.types : Array.isArray(sp.types) ? sp.types.join(",") : "";
  const minParam = typeof sp.min === "string" ? sp.min : undefined;
  const maxParam = typeof sp.max === "string" ? sp.max : undefined;
  const sortParam = typeof sp.sort === "string" ? sp.sort : undefined;

  const filters = {
    brandIds: brandsParam ? brandsParam.split(",").filter(Boolean) : undefined,
    typeIds: typesParam ? typesParam.split(",").filter(Boolean) : undefined,
    minPrice: minParam ? Number(minParam) : undefined,
    maxPrice: maxParam ? Number(maxParam) : undefined,
    search: typeof sp.q === "string" ? sp.q : undefined,
    sort: sortParam === "PRICE_ASC" || sortParam === "PRICE_DESC" ? sortParam : undefined,
  } as const;

  const [{ items: products }, { brands, types }] = await Promise.all([
    getProducts({ filters, page: 1, pageSize: 24 }),
    getFilterOptions(),
  ]);

  return (
    <div>
      <Navbar/>
      <div className="shop-page">
        {/* Sidebar */}
        <Filters brands={brands} types={types} />

        {/* Content */}
        <main className="content">
          <h2>FIREARMS COLLECTION</h2>

          <div className="product-grid">
            {products.map((product: ProductListItem) => {
              const primaryPhoto = product.photos.find((p) => p.isPrimary) ?? product.photos[0];
              const subtitle = `${product.caliber.name}, ${product.type.name}`;
              return (
                <Link href={`/ProductDetail/${product.id}`} key={product.id} className="product-card">
                  {product.tag && (
                    <span className={`tag ${product.tag === "NEW" ? "new" : "top"}`}>
                      {product.tag}
                    </span>
                  )}
                  {primaryPhoto ? (
                    <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                      <Image src={primaryPhoto.url} alt={primaryPhoto.alt ?? product.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ height: 180 }} />
                  )}
                  <h4>{product.name}</h4>
                  <p>{subtitle}</p>
                  <h3>{formatINR(product.price)}</h3>
                  <button className="add-to-cart">ADD TO CART</button>
                </Link>
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
