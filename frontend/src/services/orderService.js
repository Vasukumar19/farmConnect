import api from './api';

export const createOrder = (payload) => api.post('/order/create', payload);
export const getMyOrders = () => api.get('/order/my-orders');
export const getFarmerOrders = () => api.get('/order/farmer-orders');
export const updateOrderStatus = (orderId, status) => api.put(`/order/${orderId}/status`, { status });
export const cancelOrder = (orderId) => api.put(`/order/${orderId}/cancel`);
