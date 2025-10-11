import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

 useEffect(() => {
  if (isAuthenticated && user?.userType === 'customer') {
    fetchCart();
  } else {
    setCart({});
  }
}, [isAuthenticated, user?._id]); // Added user._id to dependencies

    const fetchCart = async () => {
      try {
        setLoading(true);
        console.log('Fetching cart...'); // Debug
        const response = await api.get('/cart/get');
        console.log('Cart response:', response.data); // Debug
        if (response.data.success) {
          setCart(response.data.cartData || {});
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    };

  const addToCart = async (productId, quantity = 1) => {
  if (!isAuthenticated) {
    alert('Please login to add items to cart');
    return { success: false, message: 'Not authenticated' };
  }

  try {
    // Send quantity directly instead of looping
    const response = await api.post('/cart/add', { 
      itemId: productId 
    });
    
    if (response.data.success) {
      setCart(response.data.cartData);
      // If quantity > 1, update the quantity
      if (quantity > 1) {
        const updateResponse = await api.post('/cart/update-item', { 
          itemId: productId, 
          quantity: quantity 
        });
        if (updateResponse.data.success) {
          setCart(updateResponse.data.cartData);
        }
      }
      return { success: true, message: 'Added to cart' };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, message: 'Failed to add to cart' };
  }
};

  const removeFromCart = async (productId) => {
    try {
      const response = await api.post('/cart/remove', { itemId: productId });
      if (response.data.success) {
        setCart(response.data.cartData);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false };
    }
  };

const updateQty = async (productId, quantity) => {
  try {
    if (quantity === 0) {
      return await removeFromCart(productId);
    }
    const response = await api.post('/cart/update-item', { 
      itemId: productId, 
      quantity 
    });
    if (response.data.success) {
      setCart(response.data.cartData);
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error updating quantity:', error);
    return { success: false };
  }
};

  const clearCart = async () => {
    try {
      const response = await api.post('/cart/clear');
      if (response.data.success) {
        setCart({});
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false };
    }
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      clearCart,
      updateQty,
      getCartCount,
      refreshCart: fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};