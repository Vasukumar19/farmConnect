import React, { useEffect, useState } from 'react';
import { getFarmerOrders } from '../services/orderService';

export default function FarmerDashboard(){
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(()=>{
    const load = async () => {
      const res = await getFarmerOrders();
      setOrders(res.data);
      const summary = res.data.reduce((acc,o)=>{
        acc[o.status] = (acc[o.status]||0)+1;
        acc.total = (acc.total||0)+1;
        acc.revenue = (acc.revenue||0)+(o.totalPrice||0);
        return acc;
      },{});
      setStats(summary);
    };
    load();
  },[]);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Farmer Dashboard</h2>
      <div>Orders: {stats.total || 0}</div>
      <div>Revenue: {stats.revenue || 0}</div>
      <ul>
        {orders.slice(0,5).map(o=>(<li key={o._id}>{o.customerName} - {o.status}</li>))}
      </ul>
    </div>
  );
}