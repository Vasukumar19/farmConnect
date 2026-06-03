// WhatsApp integration removed. This is a harmless stub that preserves imports.
// If you want to restore WhatsApp functionality, replace this file with the original implementation.

const whatsappStub = {
  async sendOrderConfirmation() {
    return { success: false, error: 'WhatsApp integration removed' };
  },
  async sendFarmerNotification() {
    return { success: false, error: 'WhatsApp integration removed' };
  },
  async sendOrderStatusUpdate() {
    return { success: false, error: 'WhatsApp integration removed' };
  },
  async sendTextMessage() {
    return { success: false, error: 'WhatsApp integration removed' };
  },
  async sendPaymentReminder() {
    return { success: false, error: 'WhatsApp integration removed' };
  }
};

export default whatsappStub;