// WhatsApp controller removed — handlers return 410 Gone and explain removal.

export const checkWhatsAppStatus = (req, res) => {
  res.status(410).json({ success: false, message: 'WhatsApp integration removed' });
};

export const sendOrderConfirmationWhatsApp = (req, res) => {
  res.status(410).json({ success: false, message: 'WhatsApp integration removed' });
};

export const sendStatusUpdateWhatsApp = (req, res) => {
  res.status(410).json({ success: false, message: 'WhatsApp integration removed' });
};

export const notifyFarmerWhatsApp = (req, res) => {
  res.status(410).json({ success: false, message: 'WhatsApp integration removed' });
};