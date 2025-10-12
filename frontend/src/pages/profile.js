import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Profile() {
  const { user, updateUserData, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    farmName: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        farmName: user.farmName || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.name || !formData.phone || !formData.email) {
        alert(t('profile.requiredFields'));
        setLoading(false);
        return;
      }
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email
      };
      if (user?.userType === 'farmer') {
        if (formData.farmName) updateData.farmName = formData.farmName;
        if (formData.location) updateData.location = formData.location;
      } else {
        if (formData.address) updateData.address = formData.address;
      }
      const response = await api.put('/user/profile', updateData);
      if (response.data.success) {
        updateUserData(formData);
        setEditing(false);
        alert(t('profile.updateSuccess'));
      } else {
        alert(response.data.message || t('profile.updateFailed'));
      }
    } catch (error) {
      alert(error.response?.data?.message || t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user || !user.userType) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#6b7280' }}>{t('profile.loading')}</p>
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
        <div className="card">
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            color: 'white',
            padding: '32px',
            borderRadius: '12px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              width: '96px',
              height: '96px',
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '64px', height: '64px', color: '#16a34a' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                {formData.name || t('profile.profile')}
              </h1>
              <p style={{ opacity: 0.9, fontSize: '16px' }}>
                {user?.userType === 'farmer' ? t('profile.farmer') : t('profile.customer')}
              </p>
            </div>
          </div>

          {!editing ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{t('profile.info')}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-primary"
                >
                  {t('profile.editProfile')}
                </button>
              </div>
              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t('profile.fullName')}</p>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.name || t('profile.na')}</p>
                </div>
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t('profile.email')}</p>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.email || t('profile.na')}</p>
                </div>
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t('profile.phone')}</p>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.phone || t('profile.notProvided')}</p>
                </div>
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t('profile.accountType')}</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', textTransform: 'capitalize' }}>{user?.userType}</p>
                </div>
                {user?.userType === 'farmer' && (
                  <>
                    <div style={{
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t('profile.farmName')}</p>
                      <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.farmName || t('profile.notProvided')}</p>
                    </div>
                    <div style={{
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t('profile.location')}</p>
                      <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.location || t('profile.notProvided')}</p>
                    </div>
                  </>
                )}
                {user?.userType === 'customer' && (
                  <div style={{
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    padding: '16px',
                    gridColumn: '1 / -1'
                  }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t('profile.address')}</p>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.address || t('profile.notProvided')}</p>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{t('profile.status')}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#10b981',
                    borderRadius: '50%'
                  }}></div>
                  <span style={{ fontWeight: '600' }}>{t('profile.active')}</span>
                  <span style={{ color: '#9ca3af' }}>•</span>
                  <span style={{ color: '#6b7280' }}>
                    {t('profile.memberSince')} {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>{t('profile.editProfile')}</h2>
              <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="input-group">
                  <label>{t('profile.fullName')} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>{t('profile.phone')} *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label>{t('profile.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <small style={{ marginTop: '4px', color: '#6b7280' }}>{t('profile.emailNoChange')}</small>
              </div>
              {user?.userType === 'farmer' && (
                <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '24px' }}>
                  <div className="input-group">
                    <label>{t('profile.farmName')}</label>
                    <input
                      type="text"
                      name="farmName"
                      value={formData.farmName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>{t('profile.location')}</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
              {user?.userType === 'customer' && (
                <div className="input-group">
                  <label>{t('profile.address')}</label>
                  <textarea
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    style={{ fontFamily: 'inherit' }}
                  ></textarea>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {loading ? t('profile.saving') : t('profile.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      email: user?.email || '',
                      address: user?.address || '',
                      farmName: user?.farmName || '',
                      location: user?.location || ''
                    });
                  }}
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
          )}
        </div>
      </div>
    </div>
  );
}
