import "dotenv/config";

const model =
  process.argv[3] ||
  process.env.OPENROUTER_MODEL ||
  "liquid/lfm-2.5-1.2b-instruct:free";
const key = process.env.OPENROUTER_API_KEY;
const message = process.argv[2] || "what are payment options";

const prompt = `You are an intent extraction engine for FarmConnect.
Return ONLY valid JSON with this shape:
{
  "intent": "faq_payment",
  "confidence": 0.95,
  "needsConfirmation": false,
  "entities": {
    "query": null,
    "quantity": null,
    "orderId": null,
    "isOrganic": null,
    "minPrice": null,
    "maxPrice": null
  }
}
User message: "${message}"`;

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  }),
});

console.log("HTTP", response.status);
const data = await response.json();
const content = data?.choices?.[0]?.message?.content || "";
console.log("RAW CONTENT:\n", content);

const jsonMatch = content.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  try {
    console.log("PARSED:", JSON.stringify(JSON.parse(jsonMatch[0]), null, 2));
  } catch (e) {
    console.log("PARSE ERROR:", e.message);
  }
}
