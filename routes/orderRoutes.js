const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Public routes
router.post("/", orderController.createOrder);
router.get("/:id", orderController.getOrderById);

// Admin routes (add auth middleware if needed)
router.put("/:id/status", orderController.updateOrderStatus);
router.get("/", orderController.getOrders);

router.get("/count", orderController.getOrderCounts);
router.delete("/hard/:id", orderController.deleteOrder);
// Add similar routes for other statuses

module.exports = router;
