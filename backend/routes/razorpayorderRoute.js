import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const paymentRouter=express.Router();

paymentRouter.post('/create-order', createOrder);
paymentRouter.post('/verify-payment', verifyPayment);


export default paymentRouter;