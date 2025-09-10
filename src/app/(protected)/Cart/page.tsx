'use client';

import './cart.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import { FaTrash } from 'react-icons/fa';
import { useEffect, useMemo, useState } from 'react';
import { getMyCartItems } from '@/actions/cart';

interface CartItem {
  id: string | number;
  name: string;
  category: string;
  brand: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image: string;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await getMyCartItems();
        if (mounted) setCartItems(items as unknown as CartItem[]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  const shipping = 9.99;
  const tax = subtotal * 0.0875;
  const total = subtotal + shipping + tax;

  return (
    <>
      <Navbar />

      <div className="cart-container">
        <h2 className="cart-title">Your Cart</h2>

        <div className="cart-content">
          {/* Left side - Cart Items */}
          <div className="cart-items">
            {loading && cartItems.length === 0 ? (
              <></>
            ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />

                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>{item.category} • {item.brand}</p>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button>-</button>
                      <span>{item.quantity}</span>
                      <button>+</button>
                    </div>
                    <div className="cart-item-price">
                      <span className="price">${item.price.toFixed(2)}</span>
                      {item.oldPrice && (
                        <span className="old-price">${item.oldPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <FaTrash className="delete-icon" />
              </div>
            ))
            )}
          </div>

          {/* Right side - Summary */}
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="checkout-btn">Proceed to Checkout</button>
            <button className="continue-btn">Continue Shopping</button>
            <p className="secure-text">🔒 Secure checkout with SSL encryption</p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
