import express from "express";
import { addToCart, removeFromCart, getCart, clearCart,updateCartItem } from "../controllers/cartController.js";
import authMiddleware from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, addToCart);
cartRouter.post("/remove", authMiddleware, removeFromCart);
cartRouter.get("/get", authMiddleware, getCart);
cartRouter.post("/clear", authMiddleware, clearCart);
cartRouter.post("/update-item", authMiddleware, updateCartItem); 
// Added this

export default cartRouter;