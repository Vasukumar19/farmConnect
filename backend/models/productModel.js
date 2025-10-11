import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true 
  },
  description: { 
    type: String, 
    required: [true, 'Product description is required'],
    trim: true 
  },
  category: { 
    type: String, 
    enum: {
      values: ['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'herbs', 'other'],
      message: '{VALUE} is not a valid category'
    },
    required: [true, 'Product category is required']
  },
  price: { 
    type: Number, 
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Price must be greater than 0'
    }
  },
  unit: { 
    type: String, 
    enum: {
      values: ['kg', 'gram', 'piece', 'dozen', 'liter'],
      message: '{VALUE} is not a valid unit'
    },
    required: [true, 'Product unit is required']
  },
  availableQuantity: { 
    type: Number, 
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative']
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  images: [{ 
    type: String,
    trim: true
  }],
  tags: [{ 
    type: String,
    trim: true,
    lowercase: true
  }],
  isOrganicCertified: { 
    type: Boolean, 
    default: false 
  },
  isInStock: { 
    type: Boolean, 
    default: true 
  },
  farmer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: [true, 'Farmer reference is required']
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

// Auto-update isInStock based on availableQuantity
productSchema.pre('save', function(next) {
  this.isInStock = this.availableQuantity > 0;
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
productSchema.index({ farmer: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isInStock: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for calculating stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.availableQuantity === 0) return 'out_of_stock';
  if (this.availableQuantity < 10) return 'low_stock';
  return 'in_stock';
});

const productModel = mongoose.models.product || mongoose.model('product', productSchema);

export default productModel;