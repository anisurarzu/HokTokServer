const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");

// @desc    Create a new product
// @route   POST /product
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const {
    category,
    subCategory,
    name,
    images,
    price,
    prevPrice,
    discountPrice,
    description,
    sizes,
  } = req.body;

  // Validate images array
  if (!images || images.length === 0 || images.length > 3) {
    res.status(400);
    throw new Error("Please provide 1-3 product images");
  }

  const productExists = await Product.findOne({ name });

  if (productExists) {
    res.status(400);
    throw new Error("Product already exists");
  }

  // Calculate total stock from sizes
  const totalStock = sizes.reduce((sum, size) => sum + (size.stock || 0), 0);

  const product = await Product.create({
    user: req.user._id,
    category,
    subCategory,
    name,
    images,
    price,
    prevPrice,
    discountPrice,
    description,
    sizes,
    rating: 0,
    reviews: [],
  });

  res.status(201).json(product);
});

// @desc    Get all products
// @route   GET /product
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// @desc    Get single product by ID
// @route   GET /product/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Update a product
// @route   PUT /product/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const {
      category,
      subCategory,
      name,
      images,
      price,
      prevPrice,
      discountPrice,
      description,
      sizes,
    } = req.body;

    // Validate images array
    if (images && (images.length === 0 || images.length > 3)) {
      res.status(400);
      throw new Error("Please provide 1-3 product images");
    }

    // Update product fields
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.name = name || product.name;
    product.images = images || product.images;
    product.price = price || product.price;
    product.prevPrice = prevPrice !== undefined ? prevPrice : product.prevPrice;
    product.discountPrice =
      discountPrice !== undefined ? discountPrice : product.discountPrice;
    product.description = description || product.description;

    // Update sizes if provided
    if (sizes && Array.isArray(sizes)) {
      product.sizes = sizes;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update product status (soft delete)
// @route   PUT /product/soft/:id
// @access  Private
const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Verify user owns the product
    if (product.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error("Not authorized to update this product");
    }

    product.statusID = 255; // Using 255 for soft delete
    await product.save();
    res.json({ message: "Product status updated (soft deleted)" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Hard delete product
// @route   DELETE /product/hard/:id
// @access  Private
// @desc    Hard delete product
// @route   DELETE /product/hard/:id
// @access  Private
// @desc    Hard delete product
// @route   DELETE /product/hard/:id
// @access  Private
const hardDeleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If you're not enforcing ownership, simply delete the product
    await product.deleteOne();
    return res.json({ message: "Product removed from database" });

    /* 
    // If you want to enforce ownership, use this version instead:
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if product has a user reference
    if (!product.user) {
      return res.status(403).json({ message: "Product has no owner" });
    }

    // Compare IDs safely
    const productUserId = product.user._id || product.user;
    if (productUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await product.deleteOne();
    return res.json({ message: "Product removed from database" });
    */
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      message: error.message || "Failed to delete product",
    });
  }
});

// @desc    Create a new review
// @route   POST /product/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      user: req.user._id,
      name: req.user.username,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get products by price range
// @route   GET /product/price/:min/:max
// @access  Public
const getProductsByPriceRange = asyncHandler(async (req, res) => {
  const { min, max } = req.params;

  const products = await Product.find({
    price: { $gte: Number(min), $lte: Number(max) },
  });

  res.json(products);
});

// @desc    Get products by category
// @route   GET /product/category/:category
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const products = await Product.find({
    category: { $regex: new RegExp(category, "i") },
  });

  res.json(products);
});

// @desc    Get products by category and size
// @route   GET /product/category/:category/size
// @access  Public
const getProductsByCategoryAndSize = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { chest, length, sleeve, shoulder } = req.query;

  // Build size query object
  const sizeQuery = {};
  if (chest) sizeQuery["sizes.chest"] = { $gte: Number(chest) };
  if (length) sizeQuery["sizes.length"] = { $gte: Number(length) };
  if (sleeve) sizeQuery["sizes.sleeve"] = { $gte: Number(sleeve) };
  if (shoulder) sizeQuery["sizes.shoulder"] = { $gte: Number(shoulder) };

  const products = await Product.find({
    category: { $regex: new RegExp(category, "i") },
    ...sizeQuery,
  });

  res.json(products);
});

module.exports = {
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
};
