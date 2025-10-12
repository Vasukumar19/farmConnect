import React, { useEffect, useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext'; // ✅ Import language hook
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Cart() {
  const { cart, updateQty, removeFromCart, clearCart } = useCart(); // ✅ Fixed method names
  const { t } = useLanguage(); // ✅ Get translation function
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Wrap load in useCallback to fix dependency warning
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      if (Object.keys(cart).length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const entries = await Promise.all(
        Object.keys(cart).map(async (productId) => {
          try {
            const response = await api.get(`/product/${productId}`);
            return {
              ...response.data.data,
              quantity: cart[productId]
            };
          } catch (err) {
            console.error(`Error loading product ${productId}:`, err);
            return null;
          }
        })
      );
      
      setItems(entries.filter(item => item !== null));
      setLoading(false);
    } catch (error) {
      console.error('Error loading cart items:', error);
      setLoading(false);
    }
  }, [cart]);

  useEffect(() => {
    loadItems();
  }, [cart, loadItems]); // ✅ Added loadItems to dependency array

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(productId);
    } else {
      await updateQty(productId, newQuantity);
    }
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
  };

  const handleClearCart = async () => {
    if (window.confirm(t('common.confirm'))) {
      await clearCart();
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)'
      }}>
        <svg style={{ width: '96px', height: '96px', color: '#d1d5db', marginBottom: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          {t('cart.empty')} {/* ✅ Translated */}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          {t('cart.addProducts')} {/* ✅ Translated */}
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          {t('cart.continueShopping')} {/* ✅ Translated */}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
      padding: '48px 20px',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div className="max-w-screen">
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '32px' }}>
          {t('navbar.cart')} {/* ✅ Translated */}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Cart Items */}
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div key={item._id} style={{
                  display: 'flex',
                  gap: '16px',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '16px',
                  alignItems: 'center'
                }}>
                  <img
                    src={`http://localhost:4000/uploads/${item.images?.[0]}`}
                    alt={item.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80';
                    }}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '4px', color: '#111827' }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      ₹{item.price} / {item.unit}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginRight: '12px'
                  }}>
                    <button
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      style={{
                        padding: '6px 10px',
                        background: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                      min="1"
                      style={{
                        width: '50px',
                        textAlign: 'center',
                        border: 'none',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      style={{
                        padding: '6px 10px',
                        background: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item._id)}
                    className="btn btn-danger"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    {t('product.delete')} {/* ✅ Translated */}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                {t('cart.summary')} {/* ✅ Translated */}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>{t('order.total')} {t('cart.items')}</span>
                  <span>{items.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>{t('cart.subtotal')}</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: '700',
                  paddingTop: '12px',
                  borderTop: '2px solid #e5e7eb'
                }}>
                  <span>{t('cart.total')}</span>
                  <span style={{ color: '#16a34a' }}>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                {t('cart.checkout')} {/* ✅ Translated */}
              </button>

              <button
                onClick={() => navigate('/')}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#111827',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                {t('cart.continueShopping')} {/* ✅ Translated */}
              </button>

              <button
                onClick={handleClearCart}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                {t('product.delete')} {t('navbar.cart')} {/* ✅ Translated */}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
