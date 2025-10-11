import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        if (result.user.userType === 'farmer') {
          navigate('/farmer-products');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Login failed');
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#6b7280' }}>Sign in to your FreshConnect account</p>
        </div>

        <div className="card">
          {error && (
            <div style={{
              marginBottom: '16px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <svg style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p style={{ fontSize: '14px', color: '#991b1b' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}