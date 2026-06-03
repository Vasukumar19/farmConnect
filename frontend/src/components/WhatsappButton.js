import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function WhatsAppButton({ orderId, type = 'confirmation' }) {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState(null);

  // Check WhatsApp service status on component mount
  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
    if (!whatsappStatus?.configured) {
    setMessage('');
      
    switch (type) {
    <div style={{ margin: '10px 0' }}>
  import React from 'react';

  // WhatsApp UI removed — component kept as a harmless no-op.
  export default function WhatsAppButton() {
    return null;
  }
}


{/* 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 */}