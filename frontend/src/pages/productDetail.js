import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext'; // ✅ Import language hook
import api from '../services/api';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage(); // ✅ Get translation function
  const navigate = useNavigate();

  // ✅ Wrap fetchProduct in useCallback to fix ESLint dependency warning
  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/product/${id}`);
      if (response.data.success) {
        setProduct(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [id, fetchProduct]); // ✅ Added fetchProduct to dependency array

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    for (let i = 0; i < quantity; i++) {
      await addToCart(product._id);
    }
    setAddingToCart(false);
    alert(t('cart.orderSuccess')); // ✅ Translated alert
  };

  const handleOrderNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    await handleAddToCart();
    navigate('/checkout');
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

  if (!product) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          {t('common.error')} {/* ✅ Translated */}
        </h2>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          {t('product.backToProducts')} {/* ✅ Translated */}
        </button>
      </div>
    );
  }

  const productImage = product.images && product.images[0] ? product.images[0] : null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
      padding: '48px 20px',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div className="max-w-screen">
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#16a34a',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
        >
          ← {t('product.backToProducts')} {/* ✅ Translated */}
        </button>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
          {/* Product Image */}
          <div style={{ position: 'relative' }}>
            <img
              src={productImage ? `http://localhost:4000/uploads/${productImage}` : 'https://via.placeholder.com/600x600'}
              alt={product.name}
              style={{
                width: '100%',
                borderRadius: '12px',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x600';
              }}
            />
            {product.isOrganicCertified && (
              <span className="badge badge-success" style={{ position: 'absolute', top: '16px', left: '16px' }}>
                🌿 {t('product.certifiedOrganic')} {/* ✅ Translated */}
              </span>
            )}
            {!product.isInStock && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {t('product.outOfStockMsg')} {/* ✅ Translated */}
                </span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <span className="badge badge-info" style={{ marginBottom: '16px' }}>
              {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
            </span>

            <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '36px', fontWeight: '700', color: '#16a34a' }}>
                ₹{product.price}
              </span>
              <span style={{ fontSize: '18px', color: '#6b7280' }}>
                / {product.unit}
              </span>
            </div>

            <p style={{
              fontSize: '16px',
              color: '#4b5563',
              lineHeight: '1.8',
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {product.description}
            </p>

            {/* Product Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {t('product.availableQty')} {/* ✅ Translated */}
                </p>
                <p style={{ fontWeight: '600' }}>{product.availableQuantity} {product.unit}</p>
              </div>
              {product.isOrganicCertified && (
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    {t('product.certification')} {/* ✅ Translated */}
                  </p>
                  <p style={{ fontWeight: '600' }}>🌿 {t('product.organicCertified')}</p>
                </div>
              )}
            </div>

            {/* Farmer Info */}
            {product.farmer && (
              <div className="card" style={{
                background: 'rgba(22, 163, 74, 0.05)',
                border: '1px solid rgba(22, 163, 74, 0.2)',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                  {t('product.farmerInfo')} {/* ✅ Translated */}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p>
                    <strong>{t('product.farmerName')}:</strong> {product.farmer.name}
                  </p>
                  {product.farmer.farmName && (
                    <p>
                      <strong>{t('product.farmName')}:</strong> {product.farmer.farmName}
                    </p>
                  )}
                  {product.farmer.location && (
                    <p>
                      <strong>{t('product.location')}:</strong> {product.farmer.location}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            {product.isInStock && user?.userType === 'customer' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <label style={{ fontWeight: '600' }}>
                    {t('product.quantity')}: {/* ✅ Translated */}
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{
                        padding: '8px 12px',
                        background: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.availableQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '60px',
                        textAlign: 'center',
                        border: 'none',
                        fontSize: '16px'
                      }}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.availableQuantity, quantity + 1))}
                      style={{
                        padding: '8px 12px',
                        background: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="btn btn-primary"
                  >
                    {addingToCart ? t('common.loading') : t('product.addToCart')} {/* ✅ Translated */}
                  </button>
                  <button
                    onClick={handleOrderNow}
                    className="btn btn-secondary"
                  >
                    {t('product.orderNow')} {/* ✅ Translated */}
                  </button>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{ color: '#92400e' }}>
                  {t('product.loginToOrder')} {/* ✅ Translated */}
                  {' '}
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#16a34a',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {t('navbar.login')}
                  </button>
                </p>
              </div>
            )}

            {user?.userType === 'farmer' && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{ color: '#1e40af' }}>
                  {t('product.farmerMsg')} {/* ✅ Translated */}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
