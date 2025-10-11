import api from './api';

export const getProducts = async (params = {}) => {
  try {
    const response = await api.get('/product', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch products' };
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/product/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch product' };
  }
};

export const createProduct = async (data) => {
  try {
    const response = await api.post('/product', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create product' };
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/product/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete product' };
  }
};
