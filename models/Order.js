const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    size: {
      type: String,
      required: [true, "Size is required"],
      uppercase: true,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Minimum quantity is 1"],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // ✅ Add user field here to fix populate error
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    orderNo: {
      type: String,
      unique: false,
      index: false,
    },
    customer: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Phone number is required"],
        validate: {
          validator: function (v) {
            return /^(?:\+88|01)?(?:\d{11}|\d{13})$/.test(v);
          },
          message: (props) => `${props.value} is not a valid phone number!`,
        },
      },
      address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      zone: {
        type: String,
        trim: true,
      },
    },
    delivery: {
      type: {
        type: String,
        required: [true, "Delivery type is required"],
        enum: {
          values: ["inside", "outside"],
          message: 'Delivery type must be either "inside" or "outside"',
        },
        lowercase: true,
      },
      cost: {
        type: Number,
        required: [true, "Delivery cost is required"],
        min: [0, "Delivery cost cannot be negative"],
      },
    },
    status: {
      type: {
        type: String,
        required: [true, "Status is required"],
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        lowercase: true,
        default: "pending",
      },
      orderDate: {
        type: Date,
        default: Date.now,
      },
      orderDeliveryDate: {
        type: Date,
      },
    },
    payment: {
      method: {
        type: String,
        required: [true, "Payment method is required"],
        enum: {
          values: ["cod", "card", "banktransfer"],
          message: 'Payment method must be "cod", "card", or "banktransfer"',
        },
        lowercase: true,
        default: "cod",
      },
      amount: {
        type: Number,
        required: [true, "Payment amount is required"],
        min: [0, "Payment amount cannot be negative"],
      },
      paid: {
        type: Boolean,
        default: false,
      },
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    note: {
      type: String,
      maxlength: [500, "Note cannot be longer than 500 characters"],
    },
    tracking: {
      courier: {
        type: String,
        enum: ["Pathao", "RedX", "Steadfast", "Others"],
        trim: true,
      },
      trackingId: {
        type: String,
        trim: true,
      },
      trackingUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true;
            return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
          },
          message: (props) => `${props.value} is not a valid URL!`,
        },
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Order number generation
orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const count = await mongoose.model("Order").countDocuments({
    createdAt: {
      $gte: new Date(now.getFullYear(), now.getMonth(), 1),
      $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    },
  });

  this.orderNo = `${year}${month}${(count + 1).toString().padStart(3, "0")}`;
  next();
});

// Update delivery date if status becomes 'delivered'
orderSchema.pre("save", function (next) {
  if (this.isModified("status.type") && this.status.type === "delivered") {
    this.status.orderDeliveryDate = new Date();
    this.payment.paid =
      this.payment.method === "cod" ? true : this.payment.paid;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
