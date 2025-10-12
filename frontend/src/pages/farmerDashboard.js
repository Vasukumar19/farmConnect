import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext'; // Multilanguage support
import api from '../services/api';

export default function FarmerProducts() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage(); // Translation hook

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

  // Load user products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/mine`);
      setProducts(res.data.data);
    } catch (error) {
      alert(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (_id) => {
    if (!window.confirm(t('product.deleteConfirm'))) return;
    try {
      await api.delete(`/product/${_id}`);
      alert(t('product.deleted'));
      loadProducts();
    } catch (error) {
      alert(t('common.error'));
    }
  };

  // Add/Edit form handlers and more logic here (omitted for clarity)

  if (loading) return <div>{t('common.loading')}</div>;
  if (!isAuthenticated || user?.userType !== 'farmer') return <div>{t('common.accessDenied')}</div>;

  return (
    <div>
      <h2 style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: 12 }}>
        {t('product.myProducts')}
      </h2>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', margin: '32px' }}>
          <h3>{t('product.noProducts')}</h3>
          <p>{t('product.addFirst')}</p>
          <button onClick={() => setShowForm(true)}>{t('product.addProduct')}</button>
        </div>
      ) : (
        <table style={{ width: '100%', marginBottom: 20, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>{t('product.name')}</th>
              <th>{t('product.category')}</th>
              <th>{t('product.price')}</th>
              <th>{t('product.availableQty')}</th>
              <th>{t('product.unit')}</th>
              <th>{t('product.organic')}</th>
              <th>{t('product.edit')}</th>
              <th>{t('product.delete')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{t(`category.${product.category}`)}</td>
                <td>₹{product.price}</td>
                <td>{product.availableQuantity}</td>
                <td>{t(`unit.${product.unit}`)}</td>
                <td>
                  {product.isOrganicCertified
                    ? t('product.certifiedOrganic')
                    : t('product.inStock')}
                </td>
                <td>
                  <button onClick={() => setEditingProduct(product)}>
                    {t('product.edit')}
                  </button>
                </td>
                <td>
                  <button onClick={() => handleDelete(product._id)}>
                    {t('product.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={() => setShowForm(true)} style={{ margin: '14px 0' }}>
        {t('product.addProduct')}
      </button>

      {/* Product Form (add/edit) goes here, all labels/buttons use t('key') */}
      {/* ... */}
    </div>
  );
}
