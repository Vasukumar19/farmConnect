import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user, updateUserData, isAuthenticated } = useAuth();
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

  // Update formData whenever user changes - with proper null/undefined handling
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
      [name]: value || '' // Ensure empty string instead of undefined
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate that required fields are not empty
      if (!formData.name || !formData.phone || !formData.email) {
        alert('Name, phone, and email are required fields');
        setLoading(false);
        return;
      }

      // Prepare data to send - only send fields that are not empty
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email
      };

      // Add conditional fields based on user type
      if (user?.userType === 'farmer') {
        if (formData.farmName) updateData.farmName = formData.farmName;
        if (formData.location) updateData.location = formData.location;
      } else {
        if (formData.address) updateData.address = formData.address;
      }

      // Send update to backend
      const response = await api.put('/user/profile', updateData);
      
      if (response.data.success) {
        // Update local context with new data
        updateUserData(formData);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Wait for user data to load
  if (!isAuthenticated || !user || !user.userType) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#6b7280' }}>Loading profile...</p>
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
                {formData.name || 'Profile'}
              </h1>
              <p style={{ opacity: 0.9, fontSize: '16px' }}>
                {user?.userType === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}
              </p>
            </div>
          </div>

          {!editing ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Profile Information</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Full Name</p>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.name || 'N/A'}</p>
                </div>

                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Email Address</p>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.email || 'N/A'}</p>
                </div>

                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Phone Number</p>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.phone || 'Not provided'}</p>
                </div>

                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Account Type</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', textTransform: 'capitalize' }}>{user?.userType}</p>
                </div>

                {user?.userType === 'farmer' && (
                  <>
                    <div style={{
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Farm Name</p>
                      <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.farmName || 'Not provided'}</p>
                    </div>

                    <div style={{
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Location</p>
                      <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.location || 'Not provided'}</p>
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
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Delivery Address</p>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>{formData.address || 'Not provided'}</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Account Status</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#10b981',
                    borderRadius: '50%'
                  }}></div>
                  <span style={{ fontWeight: '600' }}>Active Account</span>
                  <span style={{ color: '#9ca3af' }}>•</span>
                  <span style={{ color: '#6b7280' }}>
                    Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Edit Profile</h2>

              <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="input-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Phone Number *</label>
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
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <small style={{ marginTop: '4px', color: '#6b7280' }}>Email cannot be changed</small>
              </div>

              {user?.userType === 'farmer' && (
                <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '24px' }}>
                  <div className="input-group">
                    <label>Farm Name</label>
                    <input
                      type="text"
                      name="farmName"
                      value={formData.farmName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Location</label>
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
                  <label>Delivery Address</label>
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    // Reset formData to current user data
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
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}