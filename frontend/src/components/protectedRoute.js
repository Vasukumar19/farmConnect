import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, userType, redirectPath = '/login' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (userType && user.userType !== userType) {
    return <Navigate to="/" replace />;
  }

  return children;
}