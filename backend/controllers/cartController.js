import userModel from "../models/userModel.js";

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.json({ success: false, message: "Item ID is required" });
    }

    // Get user from JWT token
    const userData = await userModel.findById(req.user.id);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if user is customer (using role from JWT)
    if (req.user.role !== 'customer') {
      return res.json({ success: false, message: "Only customers can use cart" });
    }

    // Initialize cartData if doesn't exist
    let cartData = userData.cartData || {};

    // Add or increment item
    if (!cartData[itemId]) {
      cartData[itemId] = 1;
    } else {
      cartData[itemId] += 1;
    }

    // Update user cart
    await userModel.findByIdAndUpdate(
      req.user.id, 
      { cartData },
      { new: true, runValidators: false }
    );

    res.json({ success: true, message: "Added to cart", cartData });

  } catch (error) {
    console.error('Error in addToCart:', error);
    res.json({ success: false, message: "Error adding to cart" });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.json({ success: false, message: "Item ID is required" });
    }

    // Get user from JWT token
    const userData = await userModel.findById(req.user.id);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};

    // Remove or decrement item
    if (cartData[itemId] && cartData[itemId] > 0) {
      cartData[itemId] -= 1;
      
      // Remove item if quantity is 0
      if (cartData[itemId] === 0) {
        delete cartData[itemId];
      }
    }

    // Update user cart
    await userModel.findByIdAndUpdate(
      req.user.id, 
      { cartData },
      { new: true, runValidators: false }
    );

    res.json({ success: true, message: "Removed from cart", cartData });

  } catch (error) {
    console.error('Error in removeFromCart:', error);
    res.json({ success: false, message: "Error removing from cart" });
  }
};

// Get user cart
const getCart = async (req, res) => {
  try {
    // Get user from JWT token
    const userData = await userModel.findById(req.user.id);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartData = userData.cartData || {};
    res.json({ success: true, cartData });

  } catch (error) {
    console.error('Error in getCart:', error);
    res.json({ success: false, message: "Error fetching cart" });
  }
};
// update quantity of item in cart
// Update item quantity in cart
const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || typeof quantity !== 'number' || quantity < 1) {
      return res.json({ success: false, message: "Valid item ID and quantity required" });
    }

    const userData = await userModel.findById(req.user.id);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
}

    let cartData = userData.cartData || {};
    cartData[itemId] = quantity;

    await userModel.findByIdAndUpdate(req.user.id, { cartData },{ new: true, runValidators: false });
    res.json({ success: true, message: "Cart item updated", cartData });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.json({ success: false, message: "Error updating cart" });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(
      req.user.id, 
      { cartData: {} },
      { new: true, runValidators: false }
    );
    
    res.json({ success: true, message: "Cart cleared" });

  } catch (error) {
    console.error('Error in clearCart:', error);
    res.json({ success: false, message: "Error clearing cart" });
  }
};

export { addToCart, removeFromCart, getCart, clearCart , updateCartItem};