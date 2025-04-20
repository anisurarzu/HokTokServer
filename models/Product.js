const mongoose = require("mongoose");

const SizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
  },
  chest: {
    type: Number,
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
  sleeve: {
    type: Number,
    required: true,
  },
  shoulder: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
});

const ProductSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: false, // Make it optional or required based on your needs
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    images: {
      type: [String], // Array of image URLs (max 3)
      required: true,
      validate: [arrayLimit, "{PATH} exceeds the limit of 3"],
    },
    price: {
      type: Number,
      required: true,
    },
    prevPrice: {
      type: Number,
      required: false,
    },
    discountPrice: {
      type: Number,
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    sizes: {
      type: [SizeSchema], // Array of size objects
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    statusID: {
      type: Number,
      default: 1, // 1 for active, 0 for inactive
    },
  },
  { timestamps: true }
);

// Custom validator for images array limit
function arrayLimit(val) {
  return val.length <= 3;
}

module.exports = mongoose.model("Product", ProductSchema);
