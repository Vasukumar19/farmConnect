import mongoose from 'mongoose';
import validator from 'validator';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Invalid email format'
    }
  },
  password: { type: String, required: true },
  userType: { 
    type: String, 
    enum: ['farmer', 'customer'], 
    required: true 
  },
  
  // Common fields for both user types
  phone: { 
    type: String, 
    required: true ,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-()]+$/.test(v);
      },
      message: 'Invalid phone number format'
    }

  },
  address: { 
    type: String,
    required: function() { return this.userType === 'customer'; }
  },
  
  // Farmer-specific fields
  farmName: { 
    type: String, 
    required: function() { return this.userType === 'farmer'; } 
  },
  location: { 
    type: String, 
    required: function() { return this.userType === 'farmer'; } 
  },
  
  // Customer-specific fields ONLY
  cartData: { 
    type: Object, 
    default: {}
  },
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

// Pre-save middleware to update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Conditional validation: cartData should only exist for customers
userSchema.pre('save', function(next) {
  if (this.userType === 'farmer' && this.cartData && Object.keys(this.cartData).length > 0) {
    this.cartData = undefined;
  }
  next();
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;