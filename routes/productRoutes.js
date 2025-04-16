const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  hardDeleteProduct,
  createProductReview,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/product", getAllProducts); // Get all products
router.get("/product/:id", getProductById); // Get single product

// Protected routes
router.post("/product", protect, createProduct); // Create new product
router.put("/product/:id", protect, updateProduct); // Update product info
router.post("/product/:id/reviews", protect, createProductReview); // Add review

// Soft delete product (statusID=255)
router.put("/product/soft/:id", protect, updateProductStatus);

// Hard delete product (remove from database)
router.delete("/product/hard/:id", protect, hardDeleteProduct);

module.exports = router;
