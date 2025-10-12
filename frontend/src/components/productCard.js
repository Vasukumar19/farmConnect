import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext'; // ✅ Import language hook

export default function ProductCard({ product }) {
  const { t } = useLanguage(); // ✅ Get translation function
  
  if (!product) return null;

  const { images, name, price, unit, _id, category, isOrganicCertified, farmer, isInStock } = product;
  const productImage = images && images[0] ? images[0] : null;

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden', borderRadius: '8px', marginBottom: '16px' }}>
        <img 
          src={productImage ? `http://localhost:4000/uploads/${productImage}` : 'https://via.placeholder.com/400x300?text=No+Image'} 
          alt={name} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        {/* ✅ Organic Badge with Translation */}
        {isOrganicCertified && (
          <span className="badge badge-success" style={{ position: 'absolute', top: '12px', left: '12px' }}>
            🌿 {t('product.organic')}
          </span>
        )}
        
        {/* ✅ Out of Stock Badge with Translation */}
        {!isInStock && (
          <span className="badge badge-danger" style={{ position: 'absolute', top: '12px', right: '12px' }}>
            {t('product.outOfStock')}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
        {name}
      </h3>

      {farmer && (
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          {t('product.farmerName')}: {farmer.name || 'Unknown Farmer'}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
          ₹{price}
        </span>
        <span style={{ color: '#6b7280', fontSize: '14px' }}>
          / {unit}
        </span>
      </div>

      {category && (
        <span className="badge badge-info" style={{ marginBottom: '16px', display: 'block' }}>
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </span>
      )}

      {/* ✅ View Details Button with Translation */}
      <Link 
        to={`/product/${_id}`} 
        className="btn btn-primary"
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        {t('product.viewDetails')}
      </Link>
    </div>
  );
}
