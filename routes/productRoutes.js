const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  hardDeleteProduct,
  createProductReview,
  getProductsByPriceRange,
  getProductsByCategory,
  getProductsByCategoryAndSize,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/product", getAllProducts);
router.get("/product/:id", getProductById);
router.get("/product/price/:min/:max", getProductsByPriceRange);
router.get("/product/category/:category", getProductsByCategory);
router.get("/product/category/:category/size", getProductsByCategoryAndSize);

// Protected routes
router.post("/product", protect, createProduct);
router.put("/product/:id", protect, updateProduct);
router.post("/product/:id/reviews", protect, createProductReview);
router.put("/product/soft/:id", protect, updateProductStatus);
router.delete("/product/hard/:id", protect, hardDeleteProduct);

module.exports = router;
