// WhatsApp frontend service removed. Export safe stubs so callers won't break.
export const whatsappService = {
  async sendOrderConfirmation() {
    return { success: false, error: 'WhatsApp integration removed' };
  },
  async sendStatusUpdate() {
    return { success: false, error: 'WhatsApp integration removed' };
  },
  async notifyFarmer() {
    return { success: false, error: 'WhatsApp integration removed' };
  }
};