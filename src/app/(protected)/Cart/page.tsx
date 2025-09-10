import './cart.css';
import Navbar from '@/app/components1/Navbar';
import Footer from '@/app/components1/Footer';
import { FaTrash } from 'react-icons/fa';

interface CartItem {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image: string;
}

export default function Cart() {
  const cartItems: CartItem[] = [
    {
      id: 1,
      name: 'Premium Wireless Headphones',
      category: 'Audio',
      brand: 'Sony',
      price: 299.99,
      oldPrice: 399.99,
      quantity: 2,
      image: '/images/headphones.jpg',
    },
    {
      id: 2,
      name: 'Gaming Mechanical Keyboard',
      category: 'Gaming',
      brand: 'Razer',
      price: 149.99,
      quantity: 1,
      image: '/images/keyboard.jpg',
    },
    {
      id: 3,
      name: 'Protective Phone Case',
      category: 'Accessories',
      brand: 'Apple',
      price: 49.99,
      quantity: 3,
      image: '/images/phonecase.jpg',
    },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
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
            {cartItems.map((item) => (
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
            ))}
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
