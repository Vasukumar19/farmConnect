import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const loadOrders = async () => {
    try {
      const params = selectedStatus ? { status: selectedStatus } : {};
      const response = await api.get('/order/customer', { params });
      
      if (response.data.success) {
        setOrders(response.data.data);
        setStats(response.data.stats || {});
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await api.post('/order/cancel', { 
        orderId,
        reason: 'Cancelled by customer'
      });
      
      if (response.data.success) {
        alert('Order cancelled successfully');
        loadOrders();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      ready: 'status-ready',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return colors[status] || 'status-pending';
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

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
      padding: '48px 20px',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div className="max-w-screen">
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '32px' }}>
          My Orders
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="card" style={{ background: 'white' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{stats.total || 0}</p>
          </div>
          <div className="card" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <p style={{ fontSize: '12px', color: '#b45309', marginBottom: '4px' }}>Pending</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#b45309' }}>{stats.pending || 0}</p>
          </div>
          <div className="card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <p style={{ fontSize: '12px', color: '#065f46', marginBottom: '4px' }}>Completed</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#065f46' }}>{stats.completed || 0}</p>
          </div>
          <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <p style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Cancelled</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#991b1b' }}>{stats.cancelled || 0}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setSelectedStatus('')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                background: selectedStatus === '' ? '#16a34a' : '#e5e7eb',
                color: selectedStatus === '' ? 'white' : '#111827'
              }}
            >
              All Orders
            </button>
            {['pending', 'confirmed', 'ready', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: selectedStatus === status ? '#16a34a' : '#e5e7eb',
                  color: selectedStatus === status ? 'white' : '#111827',
                  textTransform: 'capitalize'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
              No orders found
            </p>
            <p style={{ color: '#9ca3af' }}>You haven't placed any orders yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => (
              <div key={order._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                      {order.product?.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      Order ID: {order._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <span className={`status ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Farmer</p>
                    <p style={{ fontWeight: '600' }}>{order.farmer?.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Pickup Date</p>
                    <p style={{ fontWeight: '600' }}>
                      {new Date(order.pickupDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Amount</p>
                    <p style={{ fontWeight: '600', color: '#16a34a', fontSize: '18px' }}>
                      ₹{order.totalPrice}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Payment</p>
                    <p style={{ fontWeight: '600' }}>
                      {order.payment ? '✓ Paid' : 'Pending'}
                    </p>
                  </div>
                </div>

                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="btn btn-danger"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}