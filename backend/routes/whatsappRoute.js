// WhatsApp routes removed — kept as an empty router stub in case other files import it.
import express from 'express';

const whatsappRouter = express.Router();

// All WhatsApp endpoints have been removed. This router intentionally returns 410 Gone
// for any incoming requests to make the removal explicit.
whatsappRouter.use((req, res) => {
  res.status(410).json({ success: false, message: 'WhatsApp integration removed' });
});

export default whatsappRouter;