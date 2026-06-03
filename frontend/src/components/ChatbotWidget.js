import React, { useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const getStarterPrompts = (userType) => {
  if (userType === "farmer") {
    return [
      "How many orders today?",
      "Show low stock products",
      "Help with payment FAQs",
    ];
  }

  return [
    "Show organic tomatoes under 80",
    "Track my latest order",
    "Payment options",
  ];
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I am your FarmConnect assistant. I can help with products, cart, orders, and FAQs.",
    },
  ]);

  const { user } = useAuth();
  const { language } = useLanguage();
  const starterPrompts = useMemo(() => getStarterPrompts(user?.userType), [user?.userType]);

  const sendMessage = async (messageText) => {
    const text = messageText.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chatbot/message", {
        message: text,
        language,
      });

      const reply = response?.data?.reply || response?.data?.message || "I could not process that request.";
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (error) {
      const fallback = error?.response?.data?.message || "Unable to process request right now.";
      setMessages((prev) => [...prev, { role: "bot", text: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <h4>FarmConnect Chat</h4>
            <button onClick={() => setIsOpen(false)} type="button">
              x
            </button>
          </div>

          <div className="chatbot-body">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chatbot-message ${message.role === "user" ? "user" : "bot"}`}
              >
                {message.text}
              </div>
            ))}
            {loading && <div className="chatbot-message bot">Thinking...</div>}
          </div>

          <div className="chatbot-prompt-row">
            {starterPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="chatbot-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message..."
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      )}

      <button className="chatbot-toggle" type="button" onClick={() => setIsOpen((prev) => !prev)}>
        {isOpen ? "Close Chat" : "Chat"}
      </button>
    </div>
  );
}
