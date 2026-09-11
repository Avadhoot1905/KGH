'use client';

import './cart.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import { FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMyCartItems, removeCartItem, updateCartItemQuantity, moveCartItemToWishlist } from '@/actions/cart';
import { getCurrentUserCheckoutDetails, getUserWalletDetails } from '@/actions/profile';
import Image from 'next/image';
import Script from 'next/script';
import { useSession } from 'next-auth/react';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import { useCartWishlist } from '@/app/context/CartWishlistContext';

interface CartItem {
  id: string | number;
  productId: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  availableQuantity?: number;
  image: string;
}

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
  const { refreshCartAndWishlist } = useCartWishlist();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
        const [items, walletInfo] = await Promise.all([
          getMyCartItems(),
          getUserWalletDetails(),
        ]);
        if (mounted) {
          setCartItems(items);
          setWalletBalance(walletInfo.balance);
          // By default, select all valid items (where availableQuantity >= item.quantity and availableQuantity > 0)
          const validIds = new Set<string>();
          items.forEach((item) => {
            const avail = item.availableQuantity ?? 9999;
            if (avail > 0 && item.quantity <= avail) {
              validIds.add(String(item.id));
            }
          });
          setSelectedIds(validIds);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => selectedIds.has(String(item.id))),
    [cartItems, selectedIds]
  );

  const subtotal = useMemo(
    () => selectedCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [selectedCartItems]
  );
  const shipping = subtotal * 0.05;
  const tax = subtotal * 0.0875;
  const totalBeforeWallet = subtotal + shipping + tax;
  const walletDeduction = useWallet && walletBalance > 0 ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const total = totalBeforeWallet - walletDeduction;

  const toggleSelectItem = (id: string, isSelectable: boolean) => {
    if (!isSelectable) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableItems = cartItems.filter((item) => {
      const avail = item.availableQuantity ?? 9999;
      return avail > 0 && item.quantity <= avail;
    });

    const allSelectableChosen = selectableItems.length > 0 && selectableItems.every((item) => selectedIds.has(String(item.id)));

    if (allSelectableChosen) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((item) => String(item.id))));
    }
  };

  useEffect(() => {
    if (!paymentStep || paymentAttemptedRef.current || isProcessing || status !== 'authenticated' || !session?.user || selectedCartItems.length === 0) {
      return;
    }

    paymentAttemptedRef.current = true;
    void handleCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStep, isProcessing, status, session?.user?.email, selectedCartItems.length]);

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

    if (selectedCartItems.length === 0) {
      alert('Please select at least one item to proceed with checkout.');
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
        body: JSON.stringify({
          useWallet,
          selectedItemIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        let errMessage = 'Failed to create order';
        try {
          const errorData = await response.json();
          if (typeof errorData === 'string') {
            errMessage = errorData;
          } else if (typeof errorData?.error === 'string') {
            errMessage = errorData.error;
          } else if (errorData?.error && typeof errorData.error === 'object') {
            errMessage = JSON.stringify(errorData.error);
          } else if (errorData && typeof errorData === 'object') {
            errMessage = JSON.stringify(errorData);
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errMessage);
      }

      const data = await response.json();

      // If order is 100% paid with wallet credits
      if (data.paidWithWallet) {
        setCartItems((prev) => prev.filter((item) => !selectedIds.has(String(item.id))));
        setIsProcessing(false);
        router.push('/Cart/success');
        return;
      }

      // Step 2: Open Razorpay Checkout for remaining balance
      const hasRazorpay = typeof window !== 'undefined' && Boolean(window.Razorpay);
      if (!hasRazorpay) {
        alert('Payment gateway script is loading or blocked by browser extension. Please refresh and try again.');
        setIsProcessing(false);
        paymentAttemptedRef.current = false;
        if (paymentStep) {
          router.replace('/Cart');
        }
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
            paymentAttemptedRef.current = false;
            if (paymentStep) {
              router.replace('/Cart');
            }
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Checkout error:', error);
      paymentAttemptedRef.current = false;
      setIsProcessing(false);
      if (paymentStep) {
        router.replace('/Cart');
      }
      const rawMsg = error instanceof Error ? error.message : String(error);
      const displayMsg = rawMsg && rawMsg !== '[object Object]' ? rawMsg : 'Failed to initiate checkout. Please check server configuration or try again.';
      alert(displayMsg);
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

      setCartItems((prev) => prev.filter((item) => !selectedIds.has(String(item.id))));
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
        strategy="afterInteractive"
      />

      <Navbar />

      <div className="cart-container">
        <h2 className="cart-title">Your Shopping Cart</h2>

        <div className="cart-content">
          {/* Left side - Cart Items */}
          <div className="cart-items">
            {!loading && cartItems.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#333] mb-2 text-xs font-semibold text-gray-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      cartItems.filter((i) => (i.availableQuantity ?? 9999) > 0 && i.quantity <= (i.availableQuantity ?? 9999)).length > 0 &&
                      cartItems
                        .filter((i) => (i.availableQuantity ?? 9999) > 0 && i.quantity <= (i.availableQuantity ?? 9999))
                        .every((i) => selectedIds.has(String(i.id)))
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-red-600 cursor-pointer"
                  />
                  <span>Select All Items ({selectedIds.size}/{cartItems.length})</span>
                </label>
                <span className="text-gray-500">{selectedCartItems.length} selected for checkout</span>
              </div>
            )}

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
              cartItems.map((item) => {
                const itemIdStr = String(item.id);
                const avail = item.availableQuantity ?? 9999;
                const isOutOfStock = avail <= 0;
                const isQuantityExceeded = !isOutOfStock && item.quantity > avail;
                const isSelectable = !isOutOfStock && !isQuantityExceeded;
                const isChecked = selectedIds.has(itemIdStr);

                return (
                  <div
                    key={item.id}
                    className={`cart-item relative transition-all ${
                      !isSelectable ? 'opacity-70 bg-[#161616] border border-red-900/30' : ''
                    }`}
                  >
                    {/* Checkbox (Savana style) */}
                    <div className="pr-3 flex items-center">
                      <input
                        type="checkbox"
                        checked={isChecked && isSelectable}
                        disabled={!isSelectable}
                        onChange={() => toggleSelectItem(itemIdStr, isSelectable)}
                        className={`w-5 h-5 accent-red-600 rounded transition-all ${
                          !isSelectable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                        }`}
                        title={
                          isOutOfStock
                            ? 'Item is sold out'
                            : isQuantityExceeded
                            ? `Selected quantity (${item.quantity}) exceeds available stock (${avail}). Reduce quantity to select.`
                            : 'Include item in checkout'
                        }
                      />
                    </div>

                    <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                      <Image src={item.image} alt={item.name} className="cart-item-img" fill style={{ objectFit: 'cover' }} />
                    </div>

                    <div className="cart-item-details flex-1">
                      <h3>{item.name}</h3>
                      <p>{item.category} • {item.brand}</p>

                      {/* Savana Stock Alert Badge */}
                      {isOutOfStock ? (
                        <p className="text-xs text-red-500 font-semibold mt-1">
                          ⚠️ Sold Out! Remove or move to wishlist.
                        </p>
                      ) : isQuantityExceeded ? (
                        <div className="text-xs text-yellow-500 font-medium mt-1 space-y-0.5">
                          <p>⚠️ Stock dropped! Only {avail} item{avail > 1 ? 's' : ''} left in stock.</p>
                          <p className="text-gray-400 text-[11px]">
                            You cannot check this item until you reduce quantity to {avail} or less.
                          </p>
                        </div>
                      ) : avail <= 5 ? (
                        <p className="text-xs text-orange-400 font-medium mt-1">
                          🔥 Only {avail} left in stock!
                        </p>
                      ) : null}

                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button
                            onClick={async () => {
                              if (item.quantity === 1) {
                                setPendingRemoveItem({ id: String(item.id), productId: String(item.productId), name: item.name });
                                setShowRemoveConfirm(true);
                                return;
                              }
                              const nextQty = item.quantity - 1;
                              await updateCartItemQuantity(String(item.id), -1);
                              setCartItems((prev) =>
                                prev.map((p) => (p.id === item.id ? { ...p, quantity: nextQty } : p))
                              );

                              // If reducing quantity now makes it valid (<= stock), auto-select checkbox
                              if (nextQty <= avail && avail > 0) {
                                setSelectedIds((prev) => new Set(prev).add(itemIdStr));
                              }
                            }}
                          >-</button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={async () => {
                              if (item.quantity >= avail) {
                                alert(`Cannot increase quantity. Maximum available stock is ${avail}.`);
                                return;
                              }
                              await updateCartItemQuantity(String(item.id), 1);
                              setCartItems((prev) =>
                                prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p))
                              );
                            }}
                            disabled={item.quantity >= avail}
                            className={item.quantity >= avail ? 'opacity-30 cursor-not-allowed' : ''}
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
                );
              })
            )}
          </div>

          {/* Right side - Summary (only show when there are cart items) */}
          {cartItems.length > 0 && (
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({selectedCartItems.length} items)</span>
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
              {walletBalance > 0 && (
                <div className="my-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#333] space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-white font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <span>Use Store Wallet Balance (₹{walletBalance.toLocaleString("en-IN")})</span>
                  </label>
                  {useWallet && (
                    <p className="text-gray-400 text-[11px] pl-6">
                      {walletBalance >= totalBeforeWallet
                        ? "100% of order cost will be paid using your Store Wallet!"
                        : `₹${walletDeduction.toFixed(2)} deducted from wallet. Pay remaining balance of ₹${total.toFixed(2)} via Razorpay.`}
                    </p>
                  )}
                </div>
              )}
              {useWallet && walletDeduction > 0 && (
                <div className="summary-row text-green-500 font-semibold">
                  <span>Wallet Discount</span>
                  <span>-₹{walletDeduction.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Final Payable Amount</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <button 
                className="checkout-btn" 
                onClick={async () => {
                  if (status !== 'authenticated' || !session?.user) {
                    alert('Please sign in to proceed with checkout');
                    return;
                  }

                  if (selectedCartItems.length === 0) {
                    alert('Please select at least one item to proceed with checkout.');
                    return;
                  }

                  const profileResult = await getCurrentUserCheckoutDetails();
                  if (!profileResult.success || !profileResult.data?.profileCompleted) {
                    setProfileModalOpen(true);
                    return;
                  }

                  router.push('/Cart/checkout-details');
                }}
                disabled={isProcessing || status !== 'authenticated' || selectedCartItems.length === 0}
              >
                {isProcessing 
                  ? 'Processing...' 
                  : status !== 'authenticated' 
                  ? 'Please Sign In' 
                  : selectedCartItems.length === 0
                  ? 'Select Items to Checkout'
                  : `Proceed to Checkout (${selectedCartItems.length})`}
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
                    void refreshCartAndWishlist();
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
                    void refreshCartAndWishlist();
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
