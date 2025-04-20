const express = require("express");
const {
  createOrder,
  getOrders,
  getOrdersCount,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderStatus,
  softDeleteOrder,
  hardDeleteOrder,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create new order (protected)
router.post("/", protect, createOrder);

// Get all orders (protected)
router.get("/", protect, getOrders);

// Get order counts by status (protected)
router.get("/count", protect, getOrdersCount);

// Get logged in user's orders (protected)
router.get("/myorders", protect, getMyOrders);

// Get order by ID (protected)
router.get("/:id", protect, getOrderById);

// Update order to paid (protected)
router.put("/:id/pay", protect, updateOrderToPaid);

// Update order status (protected)
router.put("/:id/status", protect, updateOrderStatus);

// Soft delete order (protected)
router.put("/soft/:id", protect, softDeleteOrder);

// Hard delete order (protected)
router.delete("/hard/:id", protect, hardDeleteOrder);

module.exports = router;
