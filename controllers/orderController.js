const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (items && items.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  // Verify products and update stock
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }

    // Find the specific size in product
    const sizeExists = product.sizes.some(
      (s) =>
        s.chest === item.size.chest &&
        s.length === item.size.length &&
        s.sleeve === item.size.sleeve &&
        s.shoulder === item.size.shoulder
    );

    if (!sizeExists) {
      res.status(400);
      throw new Error(
        `Selected size not available for product ${product.name}`
      );
    }

    // Check stock
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for product ${product.name}`);
    }
  }

  const order = new Order({
    user: req.user._id,
    items: items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
    })),
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  // Update product stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;

  // Build query object
  const query = {};
  if (status && status !== "all") {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate("user", "name email")
    .populate({
      path: "items.product",
      select: "name image price",
    })
    .sort({ createdAt: -1 });

  res.json(orders);
});

// @desc    Get orders count by status
// @route   GET /api/orders/count
// @access  Private/Admin
const getOrdersCount = asyncHandler(async (req, res) => {
  const counts = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert array to object
  const result = {
    all: counts.reduce((sum, item) => sum + item.count, 0),
  };

  counts.forEach((item) => {
    result[item._id] = item.count;
  });

  res.json(result);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate({
      path: "items.product",
      select: "name image price category",
    });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    res.status(401);
    throw new Error("Not authorized");
  }

  res.json(order);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate({
      path: "items.product",
      select: "name image price",
    })
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer.email_address,
  };
  order.status = "Processing";

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;

  if (status === "Delivered") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Soft delete order
// @route   PUT /api/orders/soft/:id
// @access  Private/Admin
const softDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = "Cancelled";
  await order.save();
  res.json({ message: "Order cancelled (soft deleted)" });
});

// @desc    Hard delete order
// @route   DELETE /api/orders/hard/:id
// @access  Private/Admin
const hardDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Restore product stock if order wasn't cancelled
  if (order.status !== "Cancelled") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  await order.deleteOne();
  res.json({ message: "Order removed from database" });
});

module.exports = {
  createOrder,
  getOrders,
  getOrdersCount,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderStatus,
  softDeleteOrder,
  hardDeleteOrder,
};
