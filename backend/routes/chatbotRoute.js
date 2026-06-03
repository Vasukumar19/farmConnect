import express from "express";
import jwt from "jsonwebtoken";
import { chatbotMessage } from "../controllers/chatbotController.js";

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    req.user = {
      id: decoded.id?.toString(),
      userType: decoded.userType,
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

router.post("/message", optionalAuth, chatbotMessage);

export default router;
