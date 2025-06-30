const mongoose = require("mongoose");

const footerSchema = new mongoose.Schema({
  addressOne: {
    type: String,
    required: true,
  },
  addressTwo: {
    type: String,
    required: true,
  },
  addressThree: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: false,
  },
  paymentMethodImages: [
    {
      type: String,
      required: true,
    },
  ],
  email: [
    {
      type: String,
      required: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Footer", footerSchema);
