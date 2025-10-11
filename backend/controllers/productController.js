import productModel from "../models/productModel.js";
import fs from "fs";
import path from "path";

// List all products
const listProducts = async (req, res) => {
  try {
    const products = await productModel
      .find({ isInStock: true })
      .populate("farmer", "name farmName")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error in listProducts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// Add new product (Farmer only)
const addProduct = async (req, res) => {
  try {
    // Check if user is a farmer
    if (req.user.userType !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Only farmers can add products",
      });
    }

    // Check required fields
    const requiredFields = [
      "name",
      "description",
      "category",
      "price",
      "unit",
      "availableQuantity",
    ];
    for (let field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: parseFloat(req.body.price),
      unit: req.body.unit,
      availableQuantity: parseInt(req.body.availableQuantity),
      minOrderQuantity: parseInt(req.body.minOrderQuantity) || 1,
      farmer: req.user.id,
      images: req.file ? [req.file.filename] : [],
      isOrganicCertified: req.body.isOrganicCertified === "true",
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    };

    const product = new productModel(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error in addProduct:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add product",
    });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await productModel
      .findById(req.params.id)
      .populate("farmer", "name farmName location phone");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error in getProduct:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// Get farmer's products
// Get farmer's products
const getFarmerProducts = async (req, res) => {
  try {
    if (req.user.userType !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers can view their products'
      });
    }

    console.log('Farmer ID:', req.user.id); // Debug

    const products = await productModel
      .find({ farmer: req.user.id })
      .sort({ createdAt: -1 });

    console.log('Products found:', products.length); // Debug

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error in getFarmerProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer products',
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id || req.body.id;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Verify ownership
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    // Update fields if provided
    const updates = {
      name: req.body.name || product.name,
      description: req.body.description || product.description,
      category: req.body.category || product.category,
      price: req.body.price ? parseFloat(req.body.price) : product.price,
      unit: req.body.unit || product.unit,
      availableQuantity: req.body.availableQuantity ? parseInt(req.body.availableQuantity) : product.availableQuantity,
      minOrderQuantity: req.body.minOrderQuantity ? parseInt(req.body.minOrderQuantity) : product.minOrderQuantity,
      isOrganicCertified: req.body.isOrganicCertified !== undefined ? req.body.isOrganicCertified === "true" : product.isOrganicCertified,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : product.tags,
    };

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (product.images && product.images[0]) {
        const oldImagePath = path.join("uploads", product.images[0]);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updates.images = [req.file.filename];
    }

    const updatedProduct = await productModel.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// Remove product
const removeProduct = async (req, res) => {
  try {
    const productId = req.params.id || req.body.id;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Verify ownership
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this product",
      });
    }

    // Delete associated image
    if (product.images && product.images[0]) {
      const imagePath = path.join("uploads", product.images[0]);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error in removeProduct:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, isOrganic, sortBy } = req.query;
    const filter = { isInStock: true };

    // Text search
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Organic filter
    if (isOrganic !== undefined) {
      filter.isOrganicCertified = isOrganic === "true";
    }

    // Create sort object
    let sort = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case "price-asc":
          sort = { price: 1 };
          break;
        case "price-desc":
          sort = { price: -1 };
          break;
        case "name-asc":
          sort = { name: 1 };
          break;
        case "name-desc":
          sort = { name: -1 };
          break;
      }
    }

    const products = await productModel
      .find(filter)
      .populate("farmer", "name farmName location phone")
      .sort(sort)
      .limit(50);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error in searchProducts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
    });
  }
};

export {
  listProducts,
  addProduct,
  getProduct,
  getFarmerProducts,
  updateProduct,
  removeProduct,
  searchProducts,
};