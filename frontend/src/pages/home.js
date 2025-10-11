import React, { useState, useEffect } from 'react';
import ProductCard from '../components/productCard';
import api from '../services/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showOrganic, setShowOrganic] = useState(false);

  const categories = ['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'herbs', 'other'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/product/list');
      if (response.data.success) {
        setProducts(response.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.query = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (showOrganic) params.isOrganic = 'true';

      const response = await api.get('/product/search', { params });
      if (response.data.success) {
        setProducts(response.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Search failed');
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setShowOrganic(false);
    fetchProducts();
  };

  if (loading && products.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading fresh products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f0fdfa 100%)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        color: 'white',
        padding: '64px 20px',
        textAlign: 'center'
      }}>
        <div className="max-w-screen">
          <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px' }}>
            Welcome to FreshConnect
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '32px' }}>
            Fresh produce directly from local farmers to your table
          </p>

          {/* Search Bar */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="btn btn-primary"
              >
                Search
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showOrganic}
                  onChange={(e) => setShowOrganic(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '600', color: '#111827' }}>🌿 Organic Only</span>
              </label>
              {(searchQuery || selectedCategory || showOrganic) && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#16a34a',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-screen" style={{ marginTop: '48px' }}>
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '12px' }}>
              No products found
            </p>
            <p style={{ color: '#9ca3af' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Products` : 'All Products'}
              </h2>
              <span style={{ color: '#6b7280', fontWeight: '600' }}>
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>

            <div className="grid grid-cols-4">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}