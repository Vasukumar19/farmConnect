import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <AuthProvider>
    <LanguageProvider >
    
      <CartProvider>
        <App />
      </CartProvider>
    
    </LanguageProvider>
    </AuthProvider>
  </BrowserRouter>
);
