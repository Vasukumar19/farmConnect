import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
    try {
        const { amount, receipt } = req.body;
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required',
            });
        }
        const order = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: receipt || `order_${Date.now()}`,
        });
        res.json({
            success: true,
            message: 'Order created successfully',
            order: order,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message,
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
            });
        }
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed - invalid signature',
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message,
        });
    }
};

export { createOrder, verifyPayment };
