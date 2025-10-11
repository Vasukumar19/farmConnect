import express from 'express';
import { 
  createOrder, 
  getCustomerOrders, 
  getFarmerOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  getOrderStats,
  deleteOrder
} from '../controllers/orderController.js';
import authMiddleware from '../middleware/auth.js';

const orderRouter = express.Router();

// Customer routes
orderRouter.post('/create', authMiddleware, createOrder);
orderRouter.get('/customer', authMiddleware, getCustomerOrders);
orderRouter.post('/cancel', authMiddleware, cancelOrder);

// Farmer routes
orderRouter.get('/farmer', authMiddleware, getFarmerOrders);
orderRouter.post('/update-status', authMiddleware, updateOrderStatus);

// Common routes (both customer and farmer)
orderRouter.get('/details/:orderId', authMiddleware, getOrderDetails);
orderRouter.post('/payment', authMiddleware, updatePaymentStatus);
orderRouter.get('/stats', authMiddleware, getOrderStats);
orderRouter.post('/delete', authMiddleware, deleteOrder);

export default orderRouter;