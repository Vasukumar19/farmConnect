import express from 'express';
import { 
  addProduct, 
  listProducts, 
  getProduct, 
  getFarmerProducts, 
  updateProduct, 
  removeProduct,
  searchProducts 
} from '../controllers/productController.js';
import authMiddleware from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';

const productRouter = express.Router();

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Image storage Engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ⭐ IMPORTANT: Specific routes BEFORE generic routes
productRouter.get('/search', searchProducts);  // Specific: search
productRouter.get('/farmer-products', authMiddleware, getFarmerProducts);  // Specific: farmer-products

// Public routes (Generic - AFTER specific routes)
productRouter.get('/list', listProducts);
productRouter.get('/:id', getProduct);  // Generic: :id must be last

// Protected routes (Farmer only)
productRouter.post('/add', authMiddleware, upload.single('image'), addProduct);
productRouter.put('/:id', authMiddleware, upload.single('image'), updateProduct);
productRouter.delete('/:id', authMiddleware, removeProduct);

export default productRouter;