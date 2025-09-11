import Link from 'next/link';
import { FaSearch, FaShoppingCart, FaUser, FaHeart } from 'react-icons/fa';
import './Navbar.css';
import SearchBar from './SearchBar';

export default function Navbar() {
  return (
    <header className="navbar">
      {/* Logo */}
      <Link href="/">
        <div className="logo">KATHURIA GUN HOUSE</div>
      </Link>

      {/* Links */}
      <nav className="nav-links">
        <Link href="#">HANDGUNS</Link>
        <Link href="#">RIFLES</Link>
        <Link href="#">AMMUNITION</Link>
        <Link href="#">ACCESSORIES</Link>
      </nav>

      {/* Icons + Search */}
      <div className="nav-icons" style={{ gap: 8 }}>
        <div style={{ minWidth: 280 }}>
          <SearchBar />
        </div>
        <FaSearch className="icon" title="Search" />

        {/* Wishlist Heart */}
        <div className="wishlist-icon">
          <Link href="/Wishlist">
            <FaHeart className="icon" title="Wishlist" />
          </Link>
          <span className="wishlist-count">5</span>
        </div>

        {/* Cart */}
        <div className="cart-icon">
          <Link href="/Cart">
            <FaShoppingCart className="icon" title="Cart" />
          </Link>
          <span className="cart-count">2</span>
        </div>

        <Link href="/profile">
          <FaUser className="icon" title="Profile" />
        </Link>
      </div>
    </header>
  );
}
