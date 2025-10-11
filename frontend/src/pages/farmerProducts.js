import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function FarmerProducts() {
  const { user, isAuthenticated } = useAuth();
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

  // Wrap loadProducts in useCallback
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading farmer products for farmer:', user?.id);
      
      const response = await api.get('/product/farmer-products');
      console.log('Products response:', response.data);
      
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        console.error('Failed to load products:', response.data.message);
        alert(response.data.message || 'Failed to load products');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      alert(error.response?.data?.message || 'Failed to load products');
      setLoading(false);
    }
  }, [user?.id]); // loadProducts depends on user?.id (used in console.log)

  useEffect(() => {
    if (isAuthenticated && user?.userType === 'farmer') {
      loadProducts();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.userType, user?.id, loadProducts]); // Now loadProducts is included

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
        alert('Product updated successfully!');
      } else {
        await api.post('/product/add', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Product added successfully!');
      }
      
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Failed to save product');
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
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/product/${productId}`);
      alert('Product deleted successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting:', error);
      alert(error.response?.data?.message || 'Failed to delete product');
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
          Access Denied
        </h2>
        <p style={{ color: '#6b7280' }}>Only farmers can access this page</p>
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
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>My Products</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                <div className="input-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Fresh Tomatoes"
                  />
                </div>

                <div className="input-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Price (₹) *</label>
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
                  <label>Unit *</label>
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
                  <label>Available Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({...formData, availableQuantity: e.target.value})}
                    placeholder="100"
                  />
                </div>

                <div className="input-group">
                  <label>Minimum Order Quantity</label>
                  <input
                    type="number"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({...formData, minOrderQuantity: e.target.value})}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Description *</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your product..."
                  style={{ fontFamily: 'inherit' }}
                ></textarea>
              </div>

              <div className="input-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="fresh, organic, local"
                />
              </div>

              <div className="input-group">
                <label>Product Image</label>
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
                  🌿 Organic Certified
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
              No products yet
            </p>
            <p style={{ color: '#9ca3af' }}>Add your first product to get started</p>
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
                    crossOrigin="anonymous"  // ⭐ ADD THIS
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
                      🌿 Organic
                    </span>
                  )}
                  {product.isInStock ? (
                    <span className="badge badge-success" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      In Stock
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      Out of Stock
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
                  <span>Available: {product.availableQuantity}</span>
                  <span className="badge badge-info">{product.category}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(product)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '14px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="btn btn-danger"
                    style={{ flex: 1, fontSize: '14px' }}
                  >
                    Delete
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