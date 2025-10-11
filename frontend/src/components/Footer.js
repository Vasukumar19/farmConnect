import React from 'react';

export default function Footer(){
  return (
    <footer className="footer">
      <div className="max-w-screen">
        <p>&copy; {new Date().getFullYear()} FreshConnect. All rights reserved.</p>
        <p style={{ marginTop: '8px', fontSize: '12px' }}>
          Connecting farmers directly with customers | Fresh Produce Delivered Daily
        </p>
      </div>
    </footer>
  );
}