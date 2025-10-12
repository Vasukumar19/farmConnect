import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext'; // ✅ Import language hook
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Checkout() {
  const { cart, clearCart } = useCart(); // ✅ Removed unused refreshCart
  const { t } = useLanguage(); // ✅ Get translation function
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  const [pickupDate, setPickupDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // ✅ Wrap loadCartItems in useCallback to fix ESLint dependency warning
  const loadCartItems = useCallback(async () => {
    try {
      const items = await Promise.all(
        Object.keys(cart).map(async (productId) => {
          const response = await api.get(`/product/${productId}`);
          return {
            ...response.data.data,
            quantity: cart[productId]
          };
        })
      );
      setCartItems(items.filter(item => item._id));
      setLoading(false);
    } catch (error) {
      console.error('Error loading cart items:', error);
      setLoading(false);
    }
  }, [cart]);

  useEffect(() => {
    loadCartItems();
  }, [cart, loadCartItems]); // ✅ Added loadCartItems to dependency array

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!pickupDate) {
      alert(t('cart.selectDate')); // ✅ Translated
      return;
    }

    const selectedDate = new Date(pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert(t('cart.pastDate')); // ✅ Translated
      return;
    }

    setPlacing(true);

    try {
      for (const item of cartItems) {
        await api.post('/order/create', {
          productId: item._id,
          quantity: item.quantity,
          pickupDate,
          notes,
          paymentMethod
        });
      }

      await clearCart();
      alert(t('cart.orderSuccess')); // ✅ Translated
      navigate('/my-orders');
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error.response?.data?.message || t('common.error')); // ✅ Translated fallback
    } finally {
      setPlacing(false);
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

  if (cartItems.length === 0) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px'
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

  const total = calculateTotal();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
      padding: '48px 20px',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div className="max-w-screen">
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '32px' }}>
          {t('cart.checkout')} {/* ✅ Translated */}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Cart Items */}
          <div>
            <div className="card">
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                {t('cart.items')} {/* ✅ Translated */}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cartItems.map((item) => (
                  <div key={item._id} style={{
                    display: 'flex',
                    gap: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '16px'
                  }}>
                    <img
                      src={`http://localhost:4000/uploads/${item.images?.[0]}`}
                      alt={item.name}
                      style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        {t('product.quantity')}: {item.quantity} {item.unit} {/* ✅ Translated */}
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details Form */}
            <div className="card" style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                {t('cart.orderDetails')} {/* ✅ Translated */}
              </h2>
              
              <div className="input-group">
                 <label>{t('cart.pickupDate')} *</label>

                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="input-group">
                <label>{t('cart.paymentMethod')} *</label> {/* ✅ Translated */}
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">{t('payment.cash')}</option> {/* ✅ Translated */}
                  <option value="upi">{t('payment.upi')}</option> {/* ✅ Translated */}
                  <option value="card">{t('payment.card')}</option> {/* ✅ Translated */}
                  <option value="net_banking">{t('payment.netBanking')}</option> {/* ✅ Translated */}
                </select>
              </div>

              <div className="input-group">
                <label>{t('cart.notes')}</label> {/* ✅ Translated */}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  placeholder={t('cart.notes')} // ✅ Translated
                  style={{ fontFamily: 'inherit' }}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                {t('cart.summary')} {/* ✅ Translated */}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>{t('cart.subtotal')}</span> {/* ✅ Translated */}
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <span>{t('order.total')}</span> {/* ✅ Translated */}
                  <span>{cartItems.length}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: '700',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <span>{t('cart.total')}</span> {/* ✅ Translated */}
                  <span style={{ color: '#16a34a' }}>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                {placing ? t('cart.placingOrders') : t('cart.placeOrders')} {/* ✅ Translated */}
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
                  cursor: 'pointer'
                }}
              >
                {t('cart.continueShopping')} {/* ✅ Translated */}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
