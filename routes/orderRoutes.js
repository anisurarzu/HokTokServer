const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const pathaoController = require("../controllers/pathaoController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/", orderController.createOrder);
router.get("/:id", orderController.getOrderById);

// Admin routes (add auth middleware if needed)
router.put("/:id/status", orderController.updateOrderStatus);
router.get("/", orderController.getOrders);

router.get("/count", orderController.getOrderCounts);
router.delete("/hard/:id", orderController.deleteOrder);

// Pathao order route
router.post("/pathao/orders", protect, pathaoController.createPathaoOrder);
// Add similar routes for other statuses

module.exports = router;
