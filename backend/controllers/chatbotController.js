import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Use a more capable free model for better responses
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "liquid/lfm-2.5-1.2b-instruct:free";
const INTENT_CONFIDENCE_THRESHOLD = 0.6;

const ALLOWED_INTENTS = [
  "faq_login", "faq_payment", "faq_refund", "faq_delivery",
  "product_search", "cart_add", "cart_remove", "cart_update",
  "order_track", "order_cancel", "farmer_orders_today", "farmer_low_stock",
  "unknown",
];

const normalizeMessage = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#₹]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

// ─── Rule-based intent (fast fallback) ───────────────────────────────────────
const detectIntent = (text) => {
  const message = normalizeMessage(text);
  if (!message.trim()) return "unknown";
  if (/(login|sign in|signin|register|signup|password)/.test(message)) return "faq_login";
  if (/(payment|razorpay|upi|card|cash)/.test(message)) return "faq_payment";
  if (/(refund|return|cancel policy|policy)/.test(message)) return "faq_refund";
  if (/(delivery|pickup|\btime\b|when arrive|\beta\b)/.test(message)) return "faq_delivery";
  if (/(track|where is my order|order status|status of order)/.test(message)) return "order_track";
  if (/(cancel order|cancel my order)/.test(message)) return "order_cancel";
  if (/(add to cart|cart add|buy|order now)/.test(message)) return "cart_add";
  if (/(remove from cart|delete from cart)/.test(message)) return "cart_remove";
  if (/(update cart|change quantity|set quantity)/.test(message)) return "cart_update";
  if (/(orders today|today orders|how many orders)/.test(message)) return "farmer_orders_today";
  if (/(low stock|stock available|inventory)/.test(message)) return "farmer_low_stock";
  if (/(search|show|find|organic|under|price|category|available|vegetables|fruits|grains|dairy|meat|herbs)/.test(message)) return "product_search";
  return "unknown";
};

const extractNumber = (text) => {
  const match = text.match(/\b\d+\b/);
  return match ? Number(match[0]) : null;
};

const extractOrderId = (text) => {
  const explicit = text.match(/order\s*#?\s*([a-fA-F0-9]{24})/i);
  if (explicit?.[1]) return explicit[1];
  const generic = text.match(/\b[a-fA-F0-9]{24}\b/);
  return generic?.[0] || null;
};

const getPriceFilters = (text) => {
  const underMatch = text.match(/under\s*₹?\s*(\d+)/i);
  const aboveMatch = text.match(/above\s*₹?\s*(\d+)/i);
  return {
    maxPrice: underMatch ? Number(underMatch[1]) : undefined,
    minPrice: aboveMatch ? Number(aboveMatch[1]) : undefined,
  };
};

const getQueryToken = (message) => {
  // Remove common English filler + app-specific filter words to extract the key noun
  const STOPWORDS = /\b(show|find|search|get|fetch|give|list|display|have|has|do|does|is|are|can|could|would|should|what|which|any|some|all|me|my|i|you|we|your|the|a|an|and|or|but|for|of|with|by|to|at|on|in|near|please|want|need|looking|available|organic|under|above|price|category|near me|rs|rupees)\b/gi;
  const cleaned = normalizeMessage(message)
    .replace(STOPWORDS, " ")
    .replace(/₹?\s*\d+(\.\d+)?\s*(rs|rupees)?/gi, " ") // strip price numbers like 80, 30rs, ₹50
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "";
};

// ─── Levenshtein spell-check against real product names ──────────────────────
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

const spellCorrect = async (query) => {
  if (!query || query.length < 3) return query;
  try {
    const products = await productModel.find({ isInStock: true }).select("name category").lean();
    const candidates = [...new Set(products.flatMap(p => [p.name.toLowerCase(), p.category.toLowerCase()]))];
    let best = { word: query, dist: Infinity };
    for (const candidate of candidates) {
      const dist = levenshtein(query.toLowerCase(), candidate);
      const threshold = Math.ceil(Math.max(query.length, candidate.length) * 0.4);
      if (dist < best.dist && dist <= threshold) best = { word: candidate, dist };
    }
    return best.dist < Infinity ? best.word : query;
  } catch {
    return query;
  }
};

// ─── LLM: Intent + Entity extraction ─────────────────────────────────────────
const getLlmIntent = async (message, language = "en", userType = "guest") => {
  if (!OPENROUTER_API_KEY) return null;

  const prompt = `You are an intent extraction engine for FarmConnect, a farm-to-customer marketplace.
Return ONLY valid JSON — no explanation, no markdown, just the JSON object:
{
  "intent": "one of: faq_login, faq_payment, faq_refund, faq_delivery, product_search, cart_add, cart_remove, cart_update, order_track, order_cancel, farmer_orders_today, farmer_low_stock, unknown",
  "confidence": <number 0-1>,
  "entities": {
    "query": "<IMPORTANT: the product name or category — correct any spelling mistakes, e.g. tomotoes→tomatoes, tamatos→tomatoes, carrto→carrot. Return null if no product mentioned>",
    "quantity": <number or null>,
    "orderId": "<24-char hex or null>",
    "isOrganic": <true/false/null>,
    "minPrice": <number or null>,
    "maxPrice": <number or null>
  }
}
Context: user_role=${userType}, language=${language}
User message: "${message}"`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const cleaned = content.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      intent: ALLOWED_INTENTS.includes(parsed.intent) ? parsed.intent : "unknown",
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      entities: parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {},
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

// ─── LLM: Generate a natural reply given data ─────────────────────────────────
const generateLlmReply = async (userMessage, context) => {
  if (!OPENROUTER_API_KEY) return null;

  const systemPrompt = `You are FarmConnect's friendly AI assistant helping customers and farmers.
Be concise (2-4 sentences), helpful, and conversational. Use ₹ for prices.
You have access to live data from the database — use it in your response.`;

  const userPrompt = `User said: "${userMessage}"

Available data:
${context}

Write a short, friendly, natural reply to the user based on this data.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const requireAuth = (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, message: "Please login to use this action." });
    return false;
  }
  return true;
};

const findRecentCustomerOrder = async (userId) =>
  orderModel.findOne({ customer: userId }).populate("product", "name").sort({ createdAt: -1 });

// ─── FAQ fallback replies ─────────────────────────────────────────────────────
const FAQ_TEMPLATES = {
  faq_login: "Use the Login page and enter your registered email and password. If login fails, verify your credentials or register a new account.",
  faq_payment: "You can pay using Cash on Delivery or Razorpay (UPI, cards, netbanking) during checkout.",
  faq_refund: "You can cancel pending or confirmed orders. Refunds depend on payment mode and cancellation stage.",
  faq_delivery: "Pickup and order timing are shown on each order. Track your order status from My Orders page.",
  default: "I can help with product search, cart, orders, payments, and farming queries. What would you like to know?",
};

// ─── Main chatbot handler ────────────────────────────────────────────────────
const chatbotMessage = async (req, res) => {
  try {
    const message = req.body?.message || "";
    const language = req.body?.language || "en";
    if (!message.trim()) {
      return res.json({ success: true, intent: "unknown", reply: FAQ_TEMPLATES.default });
    }

    const lowerMessage = normalizeMessage(message);

    // Run LLM intent detection and rule-based detection in parallel
    const [llmResult] = await Promise.allSettled([
      getLlmIntent(message, language, req.user?.userType || "guest"),
    ]);

    const llm = llmResult.status === "fulfilled" ? llmResult.value : null;
    const ruleIntent = detectIntent(message);

    // Intent priority: LLM (if confident) > rules > unknown
    let intent = ruleIntent;
    let entities = {};

    if (llm) {
      // Always extract entities from LLM — it handles typos, synonyms, price extraction
      entities = llm.entities || {};
      // Only override rule-based intent when LLM is confident enough
      if (llm.confidence >= INTENT_CONFIDENCE_THRESHOLD && ruleIntent === "unknown" && llm.intent !== "unknown") {
        intent = llm.intent;
      }
    }

    // ── FAQ intents ────────────────────────────────────────────────────────────
    if (intent.startsWith("faq_")) {
      const template = FAQ_TEMPLATES[intent] || FAQ_TEMPLATES.default;
      const llmReply = await generateLlmReply(message, `FAQ context: ${template}`);
      return res.json({
        success: true,
        intent,
        reply: llmReply || template,
      });
    }

    // ── Product search (only on explicit product_search intent) ────────────────
    if (intent === "product_search") {
      const { maxPrice, minPrice } = getPriceFilters(lowerMessage);
      const priceMax = Number.isFinite(Number(entities.maxPrice)) ? Number(entities.maxPrice) : maxPrice;
      const priceMin = Number.isFinite(Number(entities.minPrice)) ? Number(entities.minPrice) : minPrice;
      const isOrganic = entities.isOrganic ?? /organic/.test(lowerMessage);

      // Build keyword — prefer LLM entity (already typo-corrected), fall back to rule + spell-check
      const llmQuery = typeof entities.query === "string" && entities.query.trim() ? entities.query.trim() : null;
      const ruleQuery = getQueryToken(lowerMessage);
      const rawQuery = llmQuery || (ruleQuery ? await spellCorrect(ruleQuery) : "");

      const GENERIC_TERMS = ["products", "items", "all", "everything", "list", "vegetables", "fruits", "grains", "dairy", "meat", "herbs", "other"];

      const filter = { isInStock: true };
      if (isOrganic) filter.isOrganicCertified = true;
      if (priceMin !== undefined || priceMax !== undefined) {
        filter.price = {};
        if (priceMin !== undefined) filter.price.$gte = priceMin;
        if (priceMax !== undefined) filter.price.$lte = priceMax;
      }

      // Check if query is a category keyword
      const CATEGORIES = ["vegetables", "fruits", "grains", "dairy", "meat", "herbs", "other"];
      const isGenericQuery = !rawQuery || GENERIC_TERMS.includes(rawQuery.toLowerCase());

      if (rawQuery && CATEGORIES.includes(rawQuery.toLowerCase())) {
        filter.category = rawQuery.toLowerCase();
      } else if (rawQuery && !isGenericQuery) {
        filter.$or = [
          { name: { $regex: rawQuery, $options: "i" } },
          { description: { $regex: rawQuery, $options: "i" } },
          { tags: { $in: [new RegExp(rawQuery, "i")] } },
          { category: { $regex: rawQuery, $options: "i" } },
        ];
      }

      const products = await productModel
        .find(filter)
        .select("name price unit availableQuantity isOrganicCertified category farmer")
        .populate("farmer", "name farmName")
        .limit(5)
        .sort({ createdAt: -1 });

      // Fuzzy fallback: if no results, try a loose character-sequence regex (handles typos)
      if (!products.length && rawQuery && !isGenericQuery) {
        const fuzzyPattern = rawQuery.split("").join(".*");
        const fuzzyFilter = {
          isInStock: true,
          ...(filter.isOrganicCertified ? { isOrganicCertified: true } : {}),
          ...(filter.price ? { price: filter.price } : {}),
          $or: [
            { name: { $regex: fuzzyPattern, $options: "i" } },
            { category: { $regex: fuzzyPattern, $options: "i" } },
          ],
        };
        const fuzzyProducts = await productModel
          .find(fuzzyFilter)
          .select("name price unit availableQuantity isOrganicCertified category farmer")
          .populate("farmer", "name farmName")
          .limit(5)
          .sort({ createdAt: -1 });
        if (fuzzyProducts.length) products.push(...fuzzyProducts);
      }

      if (!products.length) {
        const noResultCtx = `User searched for "${message}" but no matching products were found in stock.`;
        const llmReply = await generateLlmReply(message, noResultCtx);
        return res.json({
          success: true,
          intent: "product_search",
          reply: llmReply || "I couldn't find matching products. Try a different keyword or browse all categories.",
        });
      }

      const productList = products
        .map((p) => `${p.name} (${p.category}) - ₹${p.price}/${p.unit}, ${p.availableQuantity} available${p.isOrganicCertified ? ", organic ✓" : ""} — from ${p.farmer?.farmName || p.farmer?.name || "farm"}`)
        .join("\n");

      const ctx = `Found ${products.length} products:\n${productList}`;
      const llmReply = await generateLlmReply(message, ctx);
      return res.json({
        success: true,
        intent: "product_search",
        reply: llmReply || `Found ${products.length} products:\n${productList}`,
        data: { products },
      });
    }

    // ── Cart: Add ──────────────────────────────────────────────────────────────
    if (intent === "cart_add") {
      if (!requireAuth(req, res)) return;
      if (req.user.userType !== "customer") {
        return res.status(403).json({ success: false, message: "Only customers can manage cart." });
      }
      const qty = Number.isFinite(Number(entities.quantity)) ? Number(entities.quantity) : extractNumber(lowerMessage) || 1;
      const rawQuery = typeof entities.query === "string" && entities.query.trim()
        ? entities.query.trim() : getQueryToken(lowerMessage);
      const product = await productModel.findOne({ isInStock: true, name: { $regex: rawQuery || ".", $options: "i" } });

      if (!product) {
        return res.json({ success: false, intent: "cart_add", reply: `I couldn't find "${rawQuery}" in our products. Try a different name.` });
      }
      const user = await userModel.findById(req.user.id);
      const cartData = { ...(user.cartData || {}) };
      cartData[product._id] = (Number(cartData[product._id]) || 0) + qty;
      user.cartData = cartData;
      await user.save();

      const ctx = `Successfully added ${qty} ${product.unit} of ${product.name} (₹${product.price}/${product.unit}) to the user's cart.`;
      const llmReply = await generateLlmReply(message, ctx);
      return res.json({
        success: true, intent: "cart_add",
        reply: llmReply || `Added ${qty} ${product.unit} of ${product.name} to your cart! 🛒`,
      });
    }

    // ── Cart: Remove / Update ──────────────────────────────────────────────────
    if (intent === "cart_remove" || intent === "cart_update") {
      if (!requireAuth(req, res)) return;
      if (req.user.userType !== "customer") {
        return res.status(403).json({ success: false, message: "Only customers can manage cart." });
      }
      const qty = Number.isFinite(Number(entities.quantity)) ? Number(entities.quantity) : extractNumber(lowerMessage);
      const rawQuery = typeof entities.query === "string" && entities.query.trim()
        ? entities.query.trim() : getQueryToken(lowerMessage);
      const product = await productModel.findOne({ name: { $regex: rawQuery || ".", $options: "i" } });

      if (!product) return res.json({ success: false, reply: `I couldn't find "${rawQuery}" in the catalog.` });

      const user = await userModel.findById(req.user.id);
      const cartData = { ...(user.cartData || {}) };

      if (intent === "cart_remove" || qty === 0) {
        delete cartData[product._id];
        user.cartData = cartData;
        await user.save();
        const ctx = `Removed ${product.name} from the user's cart.`;
        const llmReply = await generateLlmReply(message, ctx);
        return res.json({ success: true, intent, reply: llmReply || `${product.name} removed from your cart.` });
      }

      cartData[product._id] = qty || 1;
      user.cartData = cartData;
      await user.save();
      const ctx = `Updated ${product.name} quantity to ${cartData[product._id]} in the user's cart.`;
      const llmReply = await generateLlmReply(message, ctx);
      return res.json({ success: true, intent, reply: llmReply || `Updated ${product.name} to ${cartData[product._id]} in your cart.` });
    }

    // ── Order: Track ───────────────────────────────────────────────────────────
    if (intent === "order_track") {
      if (!requireAuth(req, res)) return;
      const orderId = entities.orderId || extractOrderId(message);
      let order = null;

      if (orderId) {
        order = await orderModel.findById(orderId).populate("product", "name").populate("customer", "_id").populate("farmer", "_id");
        if (!order) return res.json({ success: false, reply: "I couldn't find that order ID." });
        const hasAccess = order.customer?._id?.toString() === req.user.id || order.farmer?._id?.toString() === req.user.id;
        if (!hasAccess) return res.status(403).json({ success: false, message: "Not authorized for this order." });
      } else if (req.user.userType === "customer") {
        order = await findRecentCustomerOrder(req.user.id);
      } else {
        order = await orderModel.findOne({ farmer: req.user.id }).populate("product", "name").sort({ createdAt: -1 });
      }

      if (!order) return res.json({ success: true, reply: "You don't have any recent orders." });

      const ctx = `Order ID: ${order._id}\nProduct: ${order.product?.name || "Product"}\nQuantity: ${order.quantity}\nStatus: ${order.status}\nTotal: ₹${order.totalPrice || 0}\nPlaced on: ${new Date(order.createdAt).toLocaleDateString()}`;
      const llmReply = await generateLlmReply(message, ctx);
      return res.json({
        success: true, intent: "order_track",
        reply: llmReply || `Your order for ${order.product?.name} is currently **${order.status}**.`,
        data: { orderId: order._id, status: order.status },
      });
    }

    // ── Order: Cancel ──────────────────────────────────────────────────────────
    if (intent === "order_cancel") {
      if (!requireAuth(req, res)) return;
      if (req.user.userType !== "customer") {
        return res.status(403).json({ success: false, message: "Only customers can cancel orders." });
      }
      const orderId = entities.orderId || extractOrderId(message);
      const order = orderId
        ? await orderModel.findById(orderId).populate("product", "name")
        : await findRecentCustomerOrder(req.user.id);

      if (!order) return res.json({ success: false, reply: "I couldn't find an order to cancel." });
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized to cancel this order." });
      }
      if (!["pending", "confirmed"].includes(order.status)) {
        const ctx = `User wanted to cancel order ${order._id} (${order.product?.name}) but it cannot be cancelled because its status is "${order.status}".`;
        const llmReply = await generateLlmReply(message, ctx);
        return res.json({ success: false, reply: llmReply || `Sorry, this order can't be cancelled because it's already "${order.status}".` });
      }

      order.status = "cancelled";
      await order.save();

      const product = await productModel.findById(order.product?._id || order.product);
      if (product) {
        product.availableQuantity += order.quantity;
        await product.save();
      }

      const ctx = `Successfully cancelled order ${order._id} for ${order.product?.name}. Stock has been restored.`;
      const llmReply = await generateLlmReply(message, ctx);
      return res.json({
        success: true, intent: "order_cancel",
        reply: llmReply || `Your order for ${order.product?.name} has been cancelled and stock restored. ✅`,
      });
    }

    // ── Farmer: Orders today ───────────────────────────────────────────────────
    if (intent === "farmer_orders_today") {
      if (!requireAuth(req, res)) return;
      if (req.user.userType !== "farmer") {
        return res.status(403).json({ success: false, message: "Only farmers can access this insight." });
      }
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const orders = await orderModel.find({ farmer: req.user.id, createdAt: { $gte: start, $lt: end } });
      const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      const ctx = `Today's orders for this farmer: ${orders.length} order(s), total revenue ₹${revenue}.`;
      const llmReply = await generateLlmReply(message, ctx);
      return res.json({
        success: true, intent: "farmer_orders_today",
        reply: llmReply || `You have ${orders.length} order(s) today with ₹${revenue} in revenue. 🌾`,
      });
    }

    // ── Farmer: Low stock ──────────────────────────────────────────────────────
    if (intent === "farmer_low_stock") {
      if (!requireAuth(req, res)) return;
      if (req.user.userType !== "farmer") {
        return res.status(403).json({ success: false, message: "Only farmers can access stock data." });
      }
      const products = await productModel
        .find({ farmer: req.user.id, availableQuantity: { $lte: 10 } })
        .select("name availableQuantity unit")
        .sort({ availableQuantity: 1 })
        .limit(10);

      const ctx = products.length
        ? `Low stock products:\n${products.map((p) => `${p.name}: ${p.availableQuantity} ${p.unit} remaining`).join("\n")}`
        : "No low-stock products found — all items are well stocked.";
      const llmReply = await generateLlmReply(message, ctx);
      return res.json({
        success: true, intent: "farmer_low_stock",
        reply: llmReply || (products.length ? `Low stock items:\n${products.map((p) => `• ${p.name}: ${p.availableQuantity} ${p.unit}`).join("\n")}` : "Great news — no low-stock products right now! ✅"),
        data: products.length ? { products } : undefined,
      });
    }

    // ── Default fallback — let LLM answer anything from platform knowledge ──────
    const platformContext = `FarmConnect is a farm-to-customer marketplace platform. Here is everything about it:

HOW TO ORDER: 1) Register/Login as a customer. 2) Browse products on the home page. 3) Click a product → Add to Cart. 4) Go to Cart page → Checkout. 5) Choose payment: Cash on Delivery or Razorpay (UPI/cards). 6) Order is confirmed and you can track it from My Orders.

HOW TO SELL (FARMERS): Register as a farmer → Go to Farmer Dashboard → Add Products with name, price, quantity, category, images.

FEATURES: Product search with filters (organic, price range, category), cart management, order tracking, order cancellation (pending/confirmed only), farmer dashboard with order and stock insights.

PAYMENTS: Cash on Delivery or Razorpay (UPI, credit/debit cards, netbanking).

ACCOUNT: Separate accounts for customers and farmers. Login at /login, Register at /register.

USER QUESTION: "${message}"`;

    const llmReply = await generateLlmReply(message, platformContext);
    return res.json({
      success: true, intent: "unknown",
      reply: llmReply || FAQ_TEMPLATES.default,
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(500).json({ success: false, message: "Failed to process your message. Please try again." });
  }
};

export { chatbotMessage };
