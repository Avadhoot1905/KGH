'use client';

import './cart.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import { FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getMyCartItems, removeCartItem, updateCartItemQuantity } from '@/actions/cart';
import { checkUserAuthentication } from '@/actions/payments';
import Image from 'next/image';
import Script from 'next/script';
import { useSession } from 'next-auth/react';

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

// Declare Razorpay type for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { data: session, status } = useSession();

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

  /**
   * Handle checkout button click
   * Creates a Razorpay order on the backend and opens checkout
   */
  const handleCheckout = async () => {
    if (isProcessing) return;

    // Check if user is authenticated
    if (status !== 'authenticated' || !session?.user) {
      alert('Please sign in to proceed with checkout');
      return;
    }

    try {
      setIsProcessing(true);

      // Step 1: Create order on backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const data = await response.json();

      // Step 2: Open Razorpay Checkout
      if (!window.Razorpay) {
        alert('Payment gateway not loaded. Please refresh and try again.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: data.key, // Razorpay Key ID from backend
        amount: data.amount, // Amount in paise
        currency: data.currency,
        order_id: data.orderId, // Order ID from Razorpay
        name: 'KGH Store',
        description: 'Purchase from KGH',
        image: '/logo.png', // Your logo
        handler: function (response: any) {
          // Frontend handler - DO NOT mark payment as successful here
          // Only show UI feedback while webhook processes the payment
          handlePaymentResponse(response);
        },
        prefill: {
          name: session.user.name || '',
          email: session.user.email || '',
          contact: '',
        },
        theme: {
          color: '#FF0000',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  /**
   * Handle payment response from Razorpay
   * NOTE: This is NOT the source of truth!
   * The webhook will actually verify and process the payment.
   */
  const handlePaymentResponse = async (response: any) => {
    try {
      // Show success message to user
      alert('Payment initiated! Processing your order...');
      
      // Clear cart items from UI
      setCartItems([]);
      setIsProcessing(false);

      // Redirect to orders page or success page
      // The webhook will process the actual payment verification
      window.location.href = '/profile'; // Redirect to profile/orders
    } catch (error) {
      console.error('Error handling payment response:', error);
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Load Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        strategy="lazyOnload"
      />

      <Navbar />

      <div className="cart-container">
        <h2 className="cart-title">Your Cart</h2>

        <div className="cart-content">
          {/* Left side - Cart Items */}
          <div className="cart-items">
            {loading ? (
              <></>
            ) : cartItems.length === 0 ? (
              <div className="empty-state p-8 text-center text-gray-400 w-full">
                <p className="text-lg font-medium">No products added yet.</p>
                <p className="mt-2">Add your first product to your cart to get started.</p>
                <Link href="/Shop"><button className="btn-red mt-4">Start Shopping</button></Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                    <Image src={item.image} alt={item.name} className="cart-item-img" fill style={{ objectFit: 'cover' }} />
                  </div>

                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>{item.category} • {item.brand}</p>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        onClick={async () => {
                          await updateCartItemQuantity(String(item.id), -1);
                          setCartItems((prev) => {
                            const next = prev.map((p) =>
                              p.id === item.id ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p
                            ).filter((p) => p.quantity > 0);
                            return next;
                          });
                        }}
                      >-</button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={async () => {
                          await updateCartItemQuantity(String(item.id), 1);
                          setCartItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p)));
                        }}
                      >+</button>
                    </div>
                    <div className="cart-item-price">
                      <span className="price">₹{item.price.toFixed(2)}</span>
                      {item.oldPrice && (
                        <span className="old-price">₹{item.oldPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <FaTrash
                  className="delete-icon"
                  onClick={async () => {
                    await removeCartItem(String(item.id));
                    setCartItems((prev) => prev.filter((p) => p.id !== item.id));
                  }}
                />
              </div>
            ))
            )}
          </div>

          {/* Right side - Summary (only show when there are cart items) */}
          {cartItems.length > 0 && (
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <button 
                className="checkout-btn" 
                onClick={handleCheckout}
                disabled={isProcessing || !razorpayLoaded || status !== 'authenticated'}
              >
                {isProcessing 
                  ? 'Processing...' 
                  : status !== 'authenticated' 
                  ? 'Please Sign In' 
                  : 'Proceed to Checkout'}
              </button>
              <Link href="/Shop">
                <button className="continue-btn">Continue Shopping</button>
              </Link>
              <p className="secure-text">🔒 Secure checkout with SSL encryption</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
