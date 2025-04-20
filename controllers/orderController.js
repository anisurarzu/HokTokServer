const Order = require("../models/Order");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (or Private if you add auth)
const createOrder = asyncHandler(async (req, res) => {
  const { customer, delivery, payment, items, subtotal, total, note } =
    req.body;

  // Validate items
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  // Validate required fields
  if (!customer?.name || !customer?.phone || !customer?.address) {
    res.status(400);
    throw new Error("Missing required customer information");
  }

  // Calculate totals if not provided
  const calculatedSubtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const calculatedTotal = calculatedSubtotal + (delivery?.cost || 0);

  const order = new Order({
    customer,
    delivery: {
      type: delivery?.type || "inside",
      cost: delivery?.cost || 0,
    },
    payment: {
      method: (payment?.method || "cod").toLowerCase(),
      amount: payment?.amount || calculatedTotal,
      paid: payment?.paid || false,
    },
    items: items.map((item) => ({
      product: item.product,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal: subtotal || calculatedSubtotal,
    total: total || calculatedTotal,
    note,
    status: {
      type: "pending",
      orderDate: new Date(),
    },
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public/Private
const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid order ID format");
  }

  const order = await Order.findById(req.params.id);

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid order ID format");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status.toLowerCase())) {
    res.status(400);
    throw new Error("Invalid status value");
  }

  order.status.type = status.toLowerCase();

  if (status.toLowerCase() === "delivered") {
    order.status.orderDeliveryDate = new Date();
    if (order.payment.method === "cod") {
      order.payment.paid = true;
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const query = {};

  if (status) {
    query["status.type"] = status.toLowerCase();
  }

  if (search) {
    query.$or = [
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
      { orderNo: { $regex: search, $options: "i" } },
    ];
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Order.countDocuments(query);

  res.json({
    orders,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    totalOrders: count,
  });
});

// @desc    Get order counts by status
// @route   GET /api/orders/count
// @access  Private/Admin
const getOrderCounts = asyncHandler(async (req, res) => {
  try {
    const counts = await Order.aggregate([
      {
        $facet: {
          all: [{ $count: "count" }],
          pending: [
            { $match: { "status.type": "pending" } },
            { $count: "count" },
          ],
          processing: [
            { $match: { "status.type": "processing" } },
            { $count: "count" },
          ],
          shipped: [
            { $match: { "status.type": "shipped" } },
            { $count: "count" },
          ],
          delivered: [
            { $match: { "status.type": "delivered" } },
            { $count: "count" },
          ],
          cancelled: [
            { $match: { "status.type": "cancelled" } },
            { $count: "count" },
          ],
        },
      },
      {
        $project: {
          all: { $ifNull: [{ $arrayElemAt: ["$all.count", 0] }, 0] },
          pending: { $ifNull: [{ $arrayElemAt: ["$pending.count", 0] }, 0] },
          processing: {
            $ifNull: [{ $arrayElemAt: ["$processing.count", 0] }, 0],
          },
          shipped: { $ifNull: [{ $arrayElemAt: ["$shipped.count", 0] }, 0] },
          delivered: {
            $ifNull: [{ $arrayElemAt: ["$delivered.count", 0] }, 0],
          },
          cancelled: {
            $ifNull: [{ $arrayElemAt: ["$cancelled.count", 0] }, 0],
          },
        },
      },
    ]);

    res.json(
      counts[0] || {
        all: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }
    );
  } catch (error) {
    console.error("Error counting orders:", error);
    res.status(500).json({
      message: "Error counting orders",
      error: error.message,
    });
  }
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid order ID format");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  await order.remove();
  res.json({ message: "Order removed" });
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
  getOrders,
  getOrderCounts,
  deleteOrder,
};
