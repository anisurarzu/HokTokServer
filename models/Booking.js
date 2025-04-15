const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    nidPassport: { type: String },
    address: { type: String },
    phone: { type: String, required: true },
    email: { type: String },

    hotelName: { type: String, required: true },
    hotelID: { type: Number },
    roomCategoryID: { type: String, required: true },
    roomCategoryName: { type: String, required: true },
    roomNumberID: { type: String, required: true },
    roomNumberName: { type: String, required: true },
    roomPrice: { type: Number, required: true },

    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    nights: { type: Number, required: true },
    adults: { type: Number },
    children: { type: Number },

    totalBill: { type: Number, required: true },
    advancePayment: { type: Number, required: true },
    duePayment: { type: Number, required: true }, // ← you might want to keep this updated
    totalPaid: { type: Number, default: 0 },
    dailyAmount: { type: Number, default: 0 },

    paymentMethod: { type: String },
    transactionId: { type: String, required: true },
    note: { type: String },

    isKitchen: { type: Boolean },
    kitchenTotalBill: { type: Number },
    extraBed: { type: Boolean },
    extraBedTotalBill: { type: Number },

    bookedBy: { type: String, required: true },
    bookedByID: { type: String, required: true },
    updatedByID: { type: String },

    bookingID: { type: String, required: true },
    bookingNo: { type: String, required: true },
    serialNo: { type: Number },
    reference: { type: String },

    createTime: { type: Date, default: Date.now },
    statusID: { type: Number, default: 1 },
    canceledBy: { type: String, default: "1" },

    invoiceDetails: [
      {
        date: { type: Date, required: true, default: Date.now },
        totalPaid: { type: Number, required: true, default: 0 },
        dailyAmount: { type: Number, required: true, default: 0 },
      },
    ],

    // Optional: if you later want to link to a separate Invoice document
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
