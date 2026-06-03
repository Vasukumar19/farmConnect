import api from './api';

/**
 * Create a Razorpay order (amount in paise)
 * @param {number} amount - Amount in paise (e.g., 50000 = ₹500)
 * @param {string} receipt - Optional receipt id
 * @returns {Promise<{orderId: string, amount: number}>}
 */
export const createRazorpayOrder = async (amount, receipt = null) => {
  const response = await api.post('/payment/create-order', {
    amount,
    receipt: receipt || `order_${Date.now()}`,
  });
  return response.data;
};

/**
 * Verify Razorpay payment signature
 * @param {object} payload - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyRazorpayPayment = async (payload) => {
  const response = await api.post('/payment/verify-payment', payload);
  return response.data;
};
