import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const cartCount = getCartCount();

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link 
          to="/" 
          className="nav-logo"
        >
          <svg style={{ width: '28px', height: '28px' }} fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
          </svg>
          <span>FreshConnect</span>
        </Link>

        {/* Menu */}
        <ul className="nav-menu" style={{ display: mobileMenuOpen ? 'flex' : 'flex', flexDirection: mobileMenuOpen ? 'column' : 'row' }}>
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
          </li>

          {user?.userType === 'customer' && (
            <>
              <li>
                <Link to="/my-orders" className={`nav-link ${isActive('/my-orders') ? 'active' : ''}`}>
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/checkout" className={`nav-link ${isActive('/checkout') ? 'active' : ''}`}>
                  🛒 Cart ({cartCount})
                </Link>
              </li>
            </>
          )}

          {user?.userType === 'farmer' && (
            <>
              <li>
                <Link to="/farmer-products" className={`nav-link ${isActive('/farmer-products') ? 'active' : ''}`}>
                  My Products
                </Link>
              </li>
              <li>
                <Link to="/farmer-orders" className={`nav-link ${isActive('/farmer-orders') ? 'active' : ''}`}>
                  Orders
                </Link>
              </li>
            </>
          )}

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                  Profile
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.3s'
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-secondary">
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px'
          }}
        >
          ☰
        </button>
      </div>
    </nav>
  );
}