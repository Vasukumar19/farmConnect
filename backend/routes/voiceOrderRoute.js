import express from 'express';
import fetch from 'node-fetch';
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "liquid/lfm-2.5-1.2b-instruct:free";

// Only these are mandatory from transcript
const REQUIRED_FIELDS = ["product", "quantity", "farmer"];

// Helper function to create date at start of day in local timezone
const getDateAtMidnight = (dateInput) => {
  let date;
  if (dateInput) {
    date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      date = new Date();
    }
  } else {
    date = new Date();
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper function to get tomorrow at midnight
const getTomorrowAtMidnight = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

// Helper to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Inline order creation logic with atomic stock updates
const createOrderDirect = async (orderData, userId, userAddress) => {
  const { productId, product, farmer, quantity, pickup_date, pickup_address, notes, paymentMethod } = orderData;

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1) {
    throw new Error("Quantity must be a positive integer");
  }

  // Handle pickup date
  let pickup;
  if (pickup_date) {
    pickup = getDateAtMidnight(pickup_date);
  } else {
    pickup = getTomorrowAtMidnight();
  }

  const today = getDateAtMidnight();

  if (pickup.valueOf() < today.valueOf()) {
    throw new Error("Pickup date cannot be in the past");
  }

  // Fuzzy product lookup
  let productDoc = null;
  if (productId) {
    productDoc = await productModel.findById(productId).populate('farmer', 'name farmName location phone');
  } else if (product && farmer) {
    const products = await productModel.find({
      name: { $regex: product, $options: "i" },
      isInStock: true
    }).populate('farmer', 'name farmName location phone');

    productDoc = products.find(p => {
      if (!p.farmer) return false;
      const farmerName = (p.farmer.name || '').toLowerCase();
      const farmName = (p.farmer.farmName || '').toLowerCase();
      const searchFarmer = farmer.toLowerCase();
      
      return farmerName.includes(searchFarmer) || 
             searchFarmer.includes(farmerName) ||
             farmName.includes(searchFarmer);
    });
  }

  if (!productDoc) {
    throw new Error(`Could not find product "${product}" from farmer "${farmer}"`);
  }

  // Validate stock and minimum order
  if (!productDoc.isInStock) {
    throw new Error(`${productDoc.name} is currently out of stock`);
  }

  if (productDoc.availableQuantity < qty) {
    throw new Error(`Only ${productDoc.availableQuantity} ${productDoc.unit} available for ${productDoc.name}`);
  }

  const minOrder = productDoc.minOrderQuantity || 1;
  if (qty < minOrder) {
    throw new Error(`Minimum order quantity for ${productDoc.name} is ${minOrder} ${productDoc.unit}`);
  }

  const totalPrice = productDoc.price * qty;

  // Atomic stock update to prevent race conditions
  const updatedProduct = await productModel.findOneAndUpdate(
    { 
      _id: productDoc._id,
      availableQuantity: { $gte: qty },
      isInStock: true
    },
    { 
      $inc: { availableQuantity: -qty }
    },
    { new: false }
  );

  if (!updatedProduct) {
    throw new Error("Product stock changed. Please try again.");
  }

  // Create order
  const newOrder = new orderModel({
    customer: userId,
    farmer: productDoc.farmer._id,
    product: productDoc._id,
    quantity: qty,
    totalPrice,
    pickupDate: pickup,
    pickupLocation: pickup_address || userAddress || productDoc.farmer.location,
    notes: notes || '',
    paymentMethod: paymentMethod || 'cash'
  });

  await newOrder.save();

  // Return populated order
  return await orderModel.findById(newOrder._id)
    .populate('product', 'name unit price')
    .populate('farmer', 'name phone')
    .populate('customer', 'name phone');
};

// Voice order route
router.post('/', authMiddleware, async (req, res) => {
  // Validate authentication
  if (!req.user?.id) {
    return res.status(401).json({ 
      success: false, 
      message: 'Please log in to place a voice order' 
    });
  }

  // Check if user is a customer
  if (req.user.userType !== 'customer') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only customers can place orders' 
    });
  }

  // Validate OpenRouter API key
  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({ 
      success: false, 
      message: 'Voice ordering is temporarily unavailable. Please use the regular order form.' 
    });
  }

  // Validate transcript
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide your order details' 
    });
  }

  const userId = req.user.id;
  const userAddress = req.user.address;

  // Provide current date context to LLM
  const today = new Date();
  const todayStr = formatDateLocal(today);
  const tomorrow = getTomorrowAtMidnight();
  const tomorrowStr = formatDateLocal(tomorrow);

  const prompt = `You are a data extraction assistant for a farm-to-table marketplace. 

IMPORTANT CONTEXT:
- Today's date is: ${todayStr}
- Tomorrow's date is: ${tomorrowStr}

Extract order information from the customer's voice transcript and return ONLY a valid JSON object with these exact fields:
{
  "product": "product name as string or null",
  "quantity": numeric value or null,
  "farmer": "farmer name as string or null",
  "pickup_date": "YYYY-MM-DD format or null",
  "pickup_address": "address string or null"
}

CRITICAL RULES:
1. Return ONLY the JSON object, NO explanations, NO markdown code blocks
2. Use null (not "null" string) for missing fields
3. Convert quantity to a NUMBER (e.g., 5, not "5" or "five")
4. Extract farmer's name (e.g., "John"), not farm name (e.g., "John's Farm")
5. For pickup_date:
   - If user says "tomorrow", use: ${tomorrowStr}
   - If user says "today", use: ${todayStr}
   - If user mentions a specific date, convert it to YYYY-MM-DD format
   - If not mentioned at all, use: null
6. Infer reasonable values when possible

Customer transcript: "${transcript}"

JSON:`;

  try {
    // Call LLM API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('OpenRouter API error:', apiResponse.status, errorText);
      throw new Error('AI service temporarily unavailable');
    }

    const data = await apiResponse.json();
    const msg = data?.choices?.[0]?.message?.content || "";

    if (!msg.trim()) {
      throw new Error('AI returned empty response');
    }

    // Remove markdown code blocks if present
    let cleanMsg = msg.trim()
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Extract JSON object
    const jsonMatch = cleanMsg.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({
        success: false,
        message: "I couldn't understand your order. Could you please try again?",
        hint: "Try saying something like: 'I want 5 kg of tomatoes from John'"
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      return res.status(422).json({
        success: false,
        message: "I couldn't process your order. Please try again with clearer details."
      });
    }

    // Validate parsed data structure
    if (!parsed || typeof parsed !== 'object') {
      return res.status(422).json({
        success: false,
        message: "I couldn't understand your order format. Please try again."
      });
    }

    // Auto-fill optional fields with defaults
    if (!parsed.pickup_date) {
      parsed.pickup_date = tomorrowStr;
    }

    if (!parsed.pickup_address) {
      parsed.pickup_address = userAddress || null;
    }

    // Normalize and validate quantity
    if (parsed.quantity !== null && parsed.quantity !== undefined) {
      const qty = typeof parsed.quantity === 'string' ? parseInt(parsed.quantity, 10) : parsed.quantity;
      if (isNaN(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "I couldn't understand the quantity. How many units do you need?",
          extracted: parsed
        });
      }
      parsed.quantity = qty;
    }

    // Check required fields
    const missingFields = REQUIRED_FIELDS.filter(
      k => !parsed[k] || (typeof parsed[k] === 'string' && parsed[k].trim() === '')
    );

    if (missingFields.length > 0) {
      const fieldMessages = {
        product: "which product you want",
        quantity: "how much you need",
        farmer: "which farmer to order from"
      };

      const missingMessages = missingFields.map(f => fieldMessages[f] || f);
      
      return res.status(400).json({
        success: false,
        message: `I need to know ${missingMessages.join(' and ')}. Could you please provide these details?`,
        missing: missingFields,
        extracted: parsed
      });
    }

    // Create order
    const createdOrder = await createOrderDirect(parsed, userId, userAddress);

    // Return success
    return res.json({
      success: true,
      order: createdOrder,
      message: `Order placed successfully! ${createdOrder.quantity} ${createdOrder.product.unit} of ${createdOrder.product.name} from ${createdOrder.farmer.name}. Pickup on ${new Date(createdOrder.pickupDate).toLocaleDateString()}.`
    });

  } catch (err) {
    console.error("Voice order error:", err.message);

    const errorMessage = err.message || 'An unexpected error occurred';
    
    // Handle specific error types
    if (err.name === 'AbortError') {
      return res.status(504).json({ 
        success: false, 
        message: 'Request timed out. Please try again.' 
      });
    }

    if (errorMessage.includes('AI service') || errorMessage.includes('OpenRouter')) {
      return res.status(503).json({ 
        success: false, 
        message: 'Voice ordering is temporarily unavailable. Please use the regular order form.' 
      });
    }

    // Business logic errors
    if (errorMessage.includes('stock') || 
        errorMessage.includes('available') || 
        errorMessage.includes('Minimum order') ||
        errorMessage.includes('not find')) {
      return res.status(400).json({ 
        success: false, 
        message: errorMessage 
      });
    }

    // Generic error
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process your order. Please try again or use the regular order form.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

export default router;