import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // User references
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: [true, 'Customer reference is required']
  },
  
  farmer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: [true, 'Farmer reference is required']
  },
  
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'product', 
    required: [true, 'Product reference is required']
  },
  
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  
  totalPrice: { 
    type: Number, 
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Total price must be greater than 0'
    }
  },
  
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  
  pickupDate: { 
    type: Date,
    required: [true, 'Pickup date is required']
    // Removed validation that checks future date in schema
    // Will be validated in controller before save
  },
  
  notes: { 
    type: String, 
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Pickup location (auto-populated from farmer's location when order is created)
  pickupLocation: { 
    type: String,
    trim: true
  },
  
  // Payment details
  payment: { 
    type: Boolean, 
    default: false 
  },
  
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'upi', 'net_banking'],
      message: '{VALUE} is not a valid payment method'
    },
    default: 'cash'
  },
  
  paymentDate: { 
    type: Date 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ farmer: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ pickupDate: 1 });

// Pre-save middleware to update timestamp
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-set payment date when payment is completed
  if (this.payment && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  
  next();
});

// Validation: Ensure customer and farmer are different users
orderSchema.pre('save', function(next) {
  if (this.isNew && this.customer.toString() === this.farmer.toString()) {
    return next(new Error('Customer and farmer cannot be the same user'));
  }
  next();
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Method to check if order can be updated by farmer
orderSchema.methods.canBeUpdatedByFarmer = function() {
  return !['completed', 'cancelled'].includes(this.status);
};

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;