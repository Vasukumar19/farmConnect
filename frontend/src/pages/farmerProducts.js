import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerProducts() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'vegetables',
    price: '',
    unit: 'kg',
    availableQuantity: '',
    minOrderQuantity: 1,
    isOrganicCertified: false,
    tags: ''
  });
  const [imageFile, setImageFile] = useState(null);

  const categories = ['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'herbs', 'other'];
  const units = ['kg', 'gram', 'piece', 'dozen', 'liter'];

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/product/farmer-products');
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        alert(response.data.message || t('product.loadFailed'));
      }
      setLoading(false);
    } catch (error) {
      alert(error.response?.data?.message || t('product.loadFailed'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthenticated && user?.userType === 'farmer') {
      loadProducts();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.userType, user?.id, loadProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editingProduct) {
        await api.put(`/product/${editingProduct._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(t('product.updateProductSuccess'));
      } else {
        await api.post('/product/add', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(t('product.addProductSuccess'));
      }
      resetForm();
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || t('product.saveFailed'));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      unit: product.unit,
      availableQuantity: product.availableQuantity,
      minOrderQuantity: product.minOrderQuantity || 1,
      isOrganicCertified: product.isOrganicCertified,
      tags: product.tags?.join(', ') || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm(t('product.confirmDelete'))) {
      return;
    }
    try {
      await api.delete(`/product/${productId}`);
      alert(t('product.deleteProductSuccess'));
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || t('product.deleteFailed'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'vegetables',
      price: '',
      unit: 'kg',
      availableQuantity: '',
      minOrderQuantity: 1,
      isOrganicCertified: false,
      tags: ''
    });
    setImageFile(null);
    setEditingProduct(null);
    setShowForm(false);
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

  if (!isAuthenticated || user?.userType !== 'farmer') {
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
          {t('common.accessDenied')}
        </h2>
        <p style={{ color: '#6b7280' }}>{t('farmer.onlyFarmersProducts')}</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{t('product.myProducts')}</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? t('common.cancel') : `+ ${t('product.addProduct')}`}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              {editingProduct ? t('product.editProduct') : t('product.addNew')}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                <div className="input-group">
                  <label>{t('product.name')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={t('product.namePlaceholder')}
                  />
                </div>

                <div className="input-group">
                  <label>{t('product.category')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {t(`category.${cat}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>{t('product.price')} (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="50.00"
                  />
                </div>

                <div className="input-group">
                  <label>{t('product.unit')} *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>{t('product.availableQty')} *</label>
                  <input
                    type="number"
                    required
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({...formData, availableQuantity: e.target.value})}
                    placeholder="100"
                  />
                </div>

                <div className="input-group">
                  <label>{t('product.minOrder')}</label>
                  <input
                    type="number"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({...formData, minOrderQuantity: e.target.value})}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>{t('product.description')} *</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={t('product.descriptionPlaceholder')}
                  style={{ fontFamily: 'inherit' }}
                ></textarea>
              </div>

              <div className="input-group">
                <label>{t('product.tags')}</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder={t('product.tagsPlaceholder')}
                />
              </div>

              <div className="input-group">
                <label>{t('product.image')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.isOrganicCertified}
                  onChange={(e) => setFormData({...formData, isOrganicCertified: e.target.checked})}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label style={{ fontWeight: '600', cursor: 'pointer' }}>
                  🌿 {t('product.organicCertified')}
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingProduct ? t('product.updateProduct') : t('product.addProduct')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
              {t('product.noProducts')}
            </p>
            <p style={{ color: '#9ca3af' }}>{t('product.addFirst')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3">
            {products.map(product => (
              <div key={product._id} className="card">
                <div style={{
                  position: 'relative',
                  height: '192px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <img
                    src={`http://localhost:4000/uploads/${product.images?.[0]}`}
                    alt={product.name}
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300';
                    }}
                  />
                  {product.isOrganicCertified && (
                    <span className="badge badge-success" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      🌿 {t('product.organic')}
                    </span>
                  )}
                  {product.isInStock ? (
                    <span className="badge badge-success" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      {t('product.inStock')}
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      {t('product.outOfStock')}
                    </span>
                  )}
                </div>

                <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', minHeight: '36px' }}>
                  {product.description.substring(0, 50)}...
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                    ₹{product.price}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    / {product.unit}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                  <span>{t('product.availableQty')}: {product.availableQuantity}</span>
                  <span className="badge badge-info">{t(`category.${product.category}`)}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(product)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '14px' }}
                  >
                    {t('product.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="btn btn-danger"
                    style={{ flex: 1, fontSize: '14px' }}
                  >
                    {t('product.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
