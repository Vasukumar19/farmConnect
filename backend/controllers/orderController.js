import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";

// Create Order (Customer only)
const createOrder = async (req, res) => {
  try {
    if (req.user.userType !== 'customer') {
      return res.json({ success: false, message: 'Only customers can create orders' });
    }

    const { productId, quantity, pickupDate, notes, paymentMethod } = req.body;

    if (!productId || !quantity || !pickupDate) {
      return res.json({ success: false, message: 'Product, quantity, and pickup date are required' });
    }

    if (quantity < 1 || !Number.isInteger(Number(quantity))) {
      return res.json({ success: false, message: 'Quantity must be a positive whole number' });
    }

    const pickup = new Date(pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (pickup < today) {
      return res.json({ success: false, message: 'Pickup date cannot be in the past' });
    }

    const product = await productModel.findById(productId).populate('farmer', 'name farmName location phone');
    
    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    if (!product.isInStock) {
      return res.json({ success: false, message: 'Product is out of stock' });
    }

    if (product.availableQuantity < quantity) {
      return res.json({ 
        success: false, 
        message: `Only ${product.availableQuantity} ${product.unit} available` 
      });
    }

    const minOrder = product.minOrderQuantity || 1;
    if (quantity < minOrder) {
      return res.json({ 
        success: false, 
        message: `Minimum order quantity is ${minOrder} ${product.unit}` 
      });
    }

    const totalPrice = product.price * quantity;

    const newOrder = new orderModel({
      customer: req.user.id,
      farmer: product.farmer._id,
      product: productId,
      quantity: parseInt(quantity),
      totalPrice,
      pickupDate: pickup,
      pickupLocation: product.farmer.location,
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash'
    });

    await newOrder.save();
    product.availableQuantity -= quantity;
    await product.save();

    const populatedOrder = await orderModel.findById(newOrder._id)
      .populate('product', 'name images price unit')
      .populate('farmer', 'name farmName location phone');

    res.json({ 
      success: true, 
      message: 'Order created successfully! The farmer will confirm your order soon.',
      data: populatedOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.json({ success: false, message: error.message || 'Error creating order' });
  }
};

const getCustomerOrders = async (req, res) => {
  try {
    if (req.user.userType !== 'customer') {
      return res.json({ success: false, message: 'Only customers can view their orders' });
    }

    const { status } = req.query;
    const filter = { customer: req.user.id };
    if (status) filter.status = status;

    const orders = await orderModel.find(filter)
      .populate('product', 'name images price unit category')
      .populate('farmer', 'name farmName location phone email')
      .sort({ createdAt: -1 });

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    res.json({ success: true, data: orders, stats });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.json({ success: false, message: 'Error fetching orders' });
  }
};

const getFarmerOrders = async (req, res) => {
  try {
    if (req.user.userType !== 'farmer') {
      return res.json({ success: false, message: 'Only farmers can view their orders' });
    }

    const { status } = req.query;
    const filter = { farmer: req.user.id }; // This should now match correctly
    if (status) filter.status = status;

    console.log('Farmer ID:', req.user.id); // Debug
    console.log('Filter:', filter); // Debug

    const orders = await orderModel.find(filter)
      .populate('product', 'name images price unit category')
      .populate('customer', 'name phone address email')
      .sort({ createdAt: -1 });

    console.log('Orders found:', orders.length); // Debug

    const stats = {
  total: orders.length,
  pending: orders.filter(o => o.status === 'pending').length,
  confirmed: orders.filter(o => o.status === 'confirmed').length,
  ready: orders.filter(o => o.status === 'ready').length,
  completed: orders.filter(o => o.status === 'completed').length,
  cancelled: orders.filter(o => o.status === 'cancelled').length,
  // ⭐ CHANGED: Include all completed orders, not just paid ones
  totalRevenue: orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0)
};

    res.json({ success: true, data: orders, stats });
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.json({ success: false, message: 'Error fetching orders' });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.json({ success: false, message: 'Order ID is required' });
    }

    const order = await orderModel.findById(orderId)
      .populate('product', 'name images price unit category description')
      .populate('farmer', 'name farmName location phone email')
      .populate('customer', 'name phone address email');

    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    if (order.customer._id.toString() !== req.user.id && 
        order.farmer._id.toString() !== req.user.id) {
      return res.json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.json({ success: false, message: 'Error fetching order details' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    if (req.user.userType !== 'farmer') {
      return res.json({ success: false, message: 'Only farmers can update order status' });
    }

    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.json({ success: false, message: 'Order ID and status are required' });
    }

    const validStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: 'Invalid status' });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    if (order.farmer.toString() !== req.user.id) {
      return res.json({ success: false, message: 'Not authorized to update this order' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.json({ 
        success: false, 
        message: `Cannot update ${order.status} orders` 
      });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await orderModel.findById(orderId)
      .populate('product', 'name images')
      .populate('customer', 'name phone');

    res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.json({ success: false, message: 'Error updating order status' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId) {
      return res.json({ success: false, message: 'Order ID is required' });
    }

    const order = await orderModel.findById(orderId).populate('product');
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.json({ success: false, message: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.json({ 
        success: false, 
        message: `Cannot cancel order with status: ${order.status}` 
      });
    }

    order.status = 'cancelled';
    if (reason) {
      order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    }
    await order.save();

    if (order.product) {
      const product = await productModel.findById(order.product._id);
      if (product) {
        product.availableQuantity += order.quantity;
        await product.save();
      }
    }

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully. Stock has been restored.'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.json({ success: false, message: 'Error cancelling order' });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    if (!orderId) {
      return res.json({ success: false, message: 'Order ID is required' });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user.id && 
        order.farmer.toString() !== req.user.id) {
      return res.json({ success: false, message: 'Not authorized' });
    }

    if (order.status === 'cancelled') {
      return res.json({ success: false, message: 'Cannot process payment for cancelled order' });
    }

    order.payment = true;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    await order.save();

    res.json({ 
      success: true, 
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.json({ success: false, message: 'Error updating payment status' });
  }
};

const getOrderStats = async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.userType === 'customer') {
      filter.customer = req.user.id;
    } else if (req.user.userType === 'farmer') {
      filter.farmer = req.user.id;
    } else {
      return res.json({ success: false, message: 'Invalid user role' });
    }

    const orders = await orderModel.find(filter);

    const stats = {
      totalOrders: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0),
      paidOrders: orders.filter(o => o.payment).length,
      unpaidOrders: orders.filter(o => !o.payment && o.status !== 'cancelled').length
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.json({ success: false, message: 'Error fetching statistics' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.json({ success: false, message: 'Order ID is required' });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'cancelled') {
      return res.json({ 
        success: false, 
        message: 'Only cancelled orders can be deleted' 
      });
    }

    await orderModel.findByIdAndDelete(orderId);
    res.json({ 
      success: true, 
      message: 'Order deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.json({ success: false, message: 'Error deleting order' });
  }
};

export { 
  createOrder, 
  getCustomerOrders, 
  getFarmerOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  getOrderStats,
  deleteOrder
};