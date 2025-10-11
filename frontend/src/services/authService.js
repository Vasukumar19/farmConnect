import api from './api';

// Register a new user
export const register = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Get user profile
export const getProfile = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};

// Update user profile
export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/users/profile', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update profile' };
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};