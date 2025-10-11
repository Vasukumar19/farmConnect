import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { getProductById } from '../services/productService';
import { useNavigate } from 'react-router-dom';

export default function Cart(){
  const { cart, updateQty, remove, clear } = useCart();
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{
    const load = async () => {
      const entries = await Promise.all(Object.keys(cart).map(async pid => {
        const res = await getProductById(pid);
        return { ...res.data, quantity: cart[pid] };
      }));
      setItems(entries);
    };
    if (Object.keys(cart).length) load();
  },[cart]);

  const total = items.reduce((s,i)=>s+i.price*i.quantity,0);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">My Cart</h2>
      {items.map(item => (
        <div key={item._id} className="flex justify-between items-center border-b py-2">
          <span>{item.name}</span>
          <input type="number" value={item.quantity} min="1" onChange={e=>updateQty(item._id, parseInt(e.target.value) || 0)} />
          <span>{item.price * item.quantity}</span>
          <button onClick={()=>remove(item._id)}>Remove</button>
        </div>
      ))}
      <div className="mt-4">Total: {total}</div>
      <button onClick={()=>navigate('/checkout')}>Proceed to Checkout</button>
      <button onClick={clear}>Clear Cart</button>
    </div>
  );
}