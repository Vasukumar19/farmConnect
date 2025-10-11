import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: 'customer',
    address: '',
    farmName: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await register(formData);
      
      if (result.success) {
        if (result.user.userType === 'farmer') {
          navigate('/farmer-products');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '48px 20px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Create Your Account
          </h2>
          <p style={{ color: '#6b7280' }}>Join FreshConnect and start your journey</p>
        </div>

        <div className="card">
          {error && (
            <div style={{
              marginBottom: '24px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* User Type Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                I am a:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  border: `2px solid ${formData.userType === 'customer' ? '#16a34a' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: formData.userType === 'customer' ? '#dcfce7' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}>
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={formData.userType === 'customer'}
                    onChange={handleChange}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🛒</div>
                    <span style={{ fontWeight: '600' }}>Customer</span>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  border: `2px solid ${formData.userType === 'farmer' ? '#16a34a' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  background: formData.userType === 'farmer' ? '#dcfce7' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}>
                  <input
                    type="radio"
                    name="userType"
                    value="farmer"
                    checked={formData.userType === 'farmer'}
                    onChange={handleChange}
                    style={{ marginRight: '8px' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🌾</div>
                    <span style={{ fontWeight: '600' }}>Farmer</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Common Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="input-group">
                <label>Full Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
              </div>

              <div className="input-group">
                <label>Phone Number *</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address *</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>

            <div className="input-group">
              <label>Password *</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <small style={{ marginTop: '4px', color: '#6b7280' }}>Must be at least 8 characters</small>
            </div>

            {/* Conditional Fields */}
            {formData.userType === 'farmer' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label>Farm Name *</label>
                  <input
                    name="farmName"
                    type="text"
                    required
                    value={formData.farmName}
                    onChange={handleChange}
                    placeholder="Green Valley Farm"
                  />
                </div>

                <div className="input-group">
                  <label>Location *</label>
                  <input
                    name="location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State"
                  />
                </div>
              </div>
            ) : (
              <div className="input-group">
                <label>Delivery Address *</label>
                <textarea
                  name="address"
                  required
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                  style={{ fontFamily: 'inherit' }}
                ></textarea>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}