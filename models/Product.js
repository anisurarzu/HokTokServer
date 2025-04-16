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
});

const ProductSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
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
    stock: {
      type: Number,
      required: true,
      default: 0,
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

module.exports = mongoose.model("Product", ProductSchema);
