'use client';

import './cart.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import { FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMyCartItems, removeCartItem, updateCartItemQuantity, moveCartItemToWishlist } from '@/actions/cart';
import { getCurrentUserCheckoutDetails } from '@/actions/profile';
import Image from 'next/image';
import Script from 'next/script';
import { useSession } from 'next-auth/react';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';

interface CartItem {
  id: string | number;
  productId: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image: string;
}

// Declare Razorpay type for TypeScript
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image: string;
  handler: (response: unknown) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export default function Cart() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<{ id: string; productId: string; name: string } | null>(null);
  const { data: session, status } = useSession();
  const paymentAttemptedRef = useRef(false);
  const paymentStep = searchParams.get('step') === 'payment';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await getMyCartItems();
        if (mounted) setCartItems(items);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  const shipping = subtotal * 0.05;
  const tax = subtotal * 0.0875;
  const total = subtotal + shipping + tax;

  useEffect(() => {
    if (!paymentStep || paymentAttemptedRef.current || isProcessing || status !== 'authenticated' || !session?.user || cartItems.length === 0 || !razorpayLoaded) {
      return;
    }

    paymentAttemptedRef.current = true;
    void handleCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStep, isProcessing, razorpayLoaded, status, session?.user?.email, cartItems.length]);

  /**
   * Handle checkout button click
   * Creates a Razorpay order on the backend and opens checkout
   */
  const handleCheckout = async () => {
    if (isProcessing) return;

    if (status !== 'authenticated' || !session?.user) {
      alert('Please sign in to proceed with checkout');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    try {
      setIsProcessing(true);
      const profileResult = await getCurrentUserCheckoutDetails();
      const addressData = profileResult.success && profileResult.data ? profileResult.data : null;

      if (!profileResult.success || !profileResult.data?.profileCompleted) {
        setIsProcessing(false);
        setProfileModalOpen(true);
        return;
      }

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
        handler: function (response: unknown) {
          void handlePaymentResponse(response, addressData);
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
      paymentAttemptedRef.current = false;
      alert(error instanceof Error ? error.message : 'Failed to initiate checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  /**
   * Handle payment response from Razorpay
   * NOTE: This is NOT the source of truth!
   * The webhook will actually verify and process the payment.
   */
  const handlePaymentResponse = async (response: unknown, profile: { fullName?: string; email?: string; phoneNumber?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; country?: string; pincode?: string } | null) => {
    try {
      const paymentResponse = response as { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string };
      if (!paymentResponse.razorpay_order_id || !paymentResponse.razorpay_payment_id) {
        throw new Error('Invalid payment response');
      }

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          total,
          fullName: profile?.fullName || session?.user?.name || '',
          email: profile?.email || session?.user?.email || '',
          phoneNumber: profile?.phoneNumber || '',
          addressLine1: profile?.addressLine1 || '',
          addressLine2: profile?.addressLine2 || '',
          landmark: '',
          city: profile?.city || '',
          state: profile?.state || '',
          country: profile?.country || '',
          pincode: profile?.pincode || '',
        }),
      });

      setCartItems([]);
      setIsProcessing(false);
      router.push('/Cart/success');
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
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 w-full gap-4 col-span-full">
                <svg className="animate-spin w-10 h-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" className="opacity-20" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
                <p className="text-sm font-medium tracking-wide">Loading cart items...</p>
              </div>
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
                          if (item.quantity === 1) {
                            setPendingRemoveItem({ id: String(item.id), productId: String(item.productId), name: item.name });
                            setShowRemoveConfirm(true);
                            return;
                          }
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
                  onClick={() => {
                    setPendingRemoveItem({ id: String(item.id), productId: String(item.productId), name: item.name });
                    setShowRemoveConfirm(true);
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
                onClick={async () => {
                  if (status !== 'authenticated' || !session?.user) {
                    alert('Please sign in to proceed with checkout');
                    return;
                  }

                  const profileResult = await getCurrentUserCheckoutDetails();
                  if (!profileResult.success || !profileResult.data?.profileCompleted) {
                    setProfileModalOpen(true);
                    return;
                  }

                  router.push('/Cart/checkout-details');
                }}
                disabled={isProcessing || status !== 'authenticated'}
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

      <ProfileCompletionModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} onSaved={() => { setProfileModalOpen(false); router.push('/Cart?step=payment'); }} />
      
      {showRemoveConfirm && pendingRemoveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[4px] animate-fade-in" onClick={() => { setShowRemoveConfirm(false); setPendingRemoveItem(null); }}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 max-w-[450px] w-[90%] mx-4 shadow-2xl text-center relative animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 bg-none border-none text-[#aaa] hover:text-white hover:bg-[#333] transition-all text-2xl w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => {
                setShowRemoveConfirm(false);
                setPendingRemoveItem(null);
              }}
              title="Close"
            >
              ×
            </button>

            <h3 className="text-xl font-semibold text-white mb-4 tracking-wide">Remove Item</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Would you like to move <strong>{pendingRemoveItem.name}</strong> to your Wishlist or remove it completely from your cart?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  try {
                    await moveCartItemToWishlist(pendingRemoveItem.id, pendingRemoveItem.productId);
                    setCartItems((prev) => prev.filter((p) => p.id !== pendingRemoveItem.id));
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setShowRemoveConfirm(false);
                    setPendingRemoveItem(null);
                  }
                }}
                className="w-full py-3 rounded-lg text-white font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
                  border: "none",
                  boxShadow: "0 4px 15px rgba(211, 47, 47, 0.3)",
                }}
              >
                Move to Wishlist
              </button>
              <button
                onClick={async () => {
                  try {
                    await removeCartItem(pendingRemoveItem.id);
                    setCartItems((prev) => prev.filter((p) => p.id !== pendingRemoveItem.id));
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setShowRemoveConfirm(false);
                    setPendingRemoveItem(null);
                  }
                }}
                className="w-full py-3 rounded-lg text-[#d32f2f] font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                style={{
                  background: "transparent",
                  border: "2px solid #d32f2f",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(211, 47, 47, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
               Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
