import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import ProductDetail from './pages/productDetail';
import Checkout from './pages/checkout';
import MyOrders from './pages/myOrders';
import FarmerProducts from './pages/farmerProducts';
import FarmerOrders from './pages/farmerOrders';
import Profile from './pages/profile';
import ProtectedRoute from './components/protectedRoute';
import './index.css';

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/farmer-products" element={<ProtectedRoute userType="farmer"><FarmerProducts /></ProtectedRoute>} />
        <Route path="/farmer-orders" element={<ProtectedRoute userType="farmer"><FarmerOrders /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;