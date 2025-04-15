const Booking = require("../models/Booking");
const dayjs = require("dayjs");

// Helper function to generate a serial number for today's bookings
const generateSerialNo = async () => {
  try {
    // Find the last booking by insertion order (using `_id` in descending order)
    const lastBooking = await Booking.findOne().sort({ _id: -1 });

    // Increment serial number based on the last serialNo, or start at 1 if no previous booking exists
    const newSerialNo = lastBooking ? lastBooking.serialNo + 1 : 1;

    return newSerialNo;
  } catch (error) {
    console.error("Error generating serial number:", error);
    throw new Error("Could not generate serial number");
  }
};

const generateBookingNo = async () => {
  const currentDate = new Date();

  // Get current year, month, and day
  const year = currentDate.getFullYear().toString().slice(-2); // Last two digits of the year
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // Month, zero-padded
  const day = currentDate.getDate().toString().padStart(2, "0"); // Day, zero-padded

  // Generate the prefix for the booking number
  const datePrefix = `${year}${month}${day}`;

  // Fetch all booking numbers that match the current date prefix
  const bookings = await Booking.find(
    { bookingNo: { $regex: `^${datePrefix}` } }, // Match bookings with the same date prefix
    { bookingNo: 1 }
  );

  // Determine the maximum serial number for today's bookings
  let maxSerialNo = 0;
  bookings.forEach((booking) => {
    if (booking.bookingNo) {
      // Extract the serial number from the bookingNo
      const serialNo = parseInt(booking.bookingNo.slice(-2), 10); // Last 2 digits for serial
      if (serialNo > maxSerialNo) {
        maxSerialNo = serialNo;
      }
    }
  });

  // Increment the maximum serial number to generate the new booking number
  const newSerialNo = (maxSerialNo + 1).toString().padStart(2, "0"); // Zero-padded
  const newBookingNo = `${datePrefix}${newSerialNo}`;

  return newBookingNo;
};

// @desc Create a new booking
// @route POST /api/bookings
const createBooking = async (req, res) => {
  const bookingData = req.body;

  try {
    let bookingNo;
    const serialNo = await generateSerialNo();

    // Check if the reference exists (i.e., the booking is associated with an existing bookingNo)
    if (bookingData.reference) {
      const referenceBooking = await Booking.findOne({
        bookingNo: bookingData.reference,
      });

      if (referenceBooking) {
        // Use the existing bookingNo from the reference
        bookingNo = referenceBooking.bookingNo;
      } else {
        // If the reference bookingNo does not exist, generate a new booking number
        bookingNo = await generateBookingNo();
      }
    } else {
      // Generate a new booking number if no reference is provided
      bookingNo = await generateBookingNo();
    }

    // Create the new booking with either the referenced or new bookingNo
    const booking = await Booking.create({
      ...bookingData,
      bookingNo,
      serialNo,
    });

    res.status(200).json({ message: "Booking created successfully", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc Update an existing booking
// @route PUT /api/bookings/:id
const updateBooking = async (req, res) => {
  const { id } = req.params;
  const bookingData = req.body;

  try {
    const booking = await Booking.findByIdAndUpdate(id, bookingData, {
      new: true,
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json({ message: "Booking updated successfully", booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc Get all bookings
// @route GET /api/bookings
const getBookings = async (req, res) => {
  try {
    // const bookings = await Booking.find({ statusID: { $ne: 255 } }).sort({
    //   createdAt: -1,
    // });
    // Fetch and sort bookings
    const bookings = await Booking.find().sort({ createdAt: -1 });

    // Respond with bookings array
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// @desc Get bookings by hotelID
// @route GET /api/bookings/hotel/:hotelID
// @desc Get bookings by hotelID (string version)
// @route GET /api/bookings/hotel/:hotelID
// @desc Get bookings by hotelID
// @route GET /api/bookings/hotel/:hotelID
const getBookingsByHotelId = async (req, res) => {
  const { hotelID } = req.body; // Extract hotelID from the body instead of params

  try {
    // Convert hotelID from string to number, since hotelID is a number in your schema
    const numericHotelID = Number(hotelID);

    // Check if the conversion was successful (not NaN)
    if (isNaN(numericHotelID)) {
      return res
        .status(400)
        .json({ error: "Invalid hotelID. Must be a number." });
    }

    // Find all bookings associated with the given hotelID and sort by creation date (latest first)
    const bookings = await Booking.find({ hotelID: numericHotelID }).sort({
      createdAt: -1,
    });

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ error: "No bookings found for this hotel ID" });
    }

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Get multiple bookings by bookingNo
const getBookingsByBookingNo = async (req, res) => {
  const { bookingNo } = req.params;

  try {
    // Find all bookings that have the same bookingNo
    const bookings = await Booking.find({ bookingNo: bookingNo });

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ error: "No bookings found for this booking number" });
    }

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Get a single booking
// @route GET /api/bookings/:id
const getBookingById = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------- soft delete----- */

const updateStatusID = async (req, res) => {
  const { id } = req.params;
  const { canceledBy } = req.body; // Assuming canceledBy comes from the request body

  try {
    // Use runValidators to enforce schema validation on updates
    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        statusID: 255,
        canceledBy, // Update the canceledBy field as well
      },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking status updated to 255 and canceledBy updated.",
      updatedBooking: booking, // Optionally include the updated booking object for debugging
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// @desc Delete a booking
// @route DELETE /api/bookings/:id
const deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* get bookings data based on check In Date  */
// @desc Get bookings by checkInDate
// @route GET /api/bookings/check-in/:date

// const getBookingsByCheckInDate = async (req, res) => {
//   const { date } = req.params;

//   try {
//     // Validate date format
//     if (!dayjs(date, "YYYY-MM-DD", true).isValid()) {
//       return res
//         .status(400)
//         .json({ error: "Invalid date format. Use YYYY-MM-DD" });
//     }

//     // Set exact date boundaries
//     const searchDate = dayjs(date).startOf("day");
//     const searchDateEnd = searchDate.endOf("day");

//     // Find bookings where:
//     // 1. Check-in is before or on search date
//     // 2. Check-out is after search date
//     const bookings = await Booking.find({
//       checkInDate: {
//         $lte: searchDateEnd.toDate(), // Checked in before end of search day
//       },
//       checkOutDate: {
//         $gt: searchDate.toDate(), // Checking out after start of search day
//       },
//     }).sort({
//       checkInDate: 1,
//       createdAt: -1,
//     });

//     res.status(200).json(bookings || []);
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const getBookingsByCheckInDate = async (req, res) => {
  const { date } = req.params;

  try {
    // Validate date format
    if (!dayjs(date, "YYYY-MM-DD", true).isValid()) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Set date boundaries
    const searchDate = dayjs(date).startOf("day");
    const searchDateEnd = searchDate.endOf("day");

    // 1. Get regular invoices (bookings matching the date)
    const regularInvoice = await Booking.find({
      checkInDate: { $lte: searchDateEnd.toDate() },
      checkOutDate: { $gt: searchDate.toDate() },
    })
      .sort({ checkInDate: 1 })
      .lean();

    // 2. Get unpaid invoices with additional filters
    const unPaidInvoice = await Booking.find({
      duePayment: { $gt: 0 },
      checkOutDate: {
        $lt: searchDate.toDate(), // Only show where checkout was BEFORE search date
      },
    })
      .sort({ checkOutDate: -1 }) // Sort by checkout date (recent first)
      .lean();

    // Format the response
    const response = {
      data: {
        regularInvoice: regularInvoice || [],
        unPaidInvoice: unPaidInvoice || [],
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getBookingsByCheckInDate:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc Update an existing booking with daily payment tracking
// @route PUT /api/bookings/:id
const updateBookingDetails = async (req, res) => {
  const { id } = req.params;
  const { totalPaid, dailyAmount, duePayment, searchDate } = req.body;

  try {
    const booking = await Booking.findById(id).populate("invoice"); // Assuming invoice is populated
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Initialize invoiceDetails if it doesn't exist
    if (!booking.invoiceDetails) {
      booking.invoiceDetails = [];
    }

    // Convert searchDate to proper Date object
    const searchDateObj = new Date(searchDate);
    const searchDateStart = dayjs(searchDateObj).startOf("day").toDate();
    const searchDateEnd = dayjs(searchDateObj).endOf("day").toDate();

    // Find existing entry for the search date
    const existingEntryIndex = booking.invoiceDetails.findIndex((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= searchDateStart && entryDate <= searchDateEnd;
    });

    if (existingEntryIndex >= 0) {
      // Update existing entry
      booking.invoiceDetails[existingEntryIndex] = {
        date: searchDateObj,
        totalPaid: totalPaid || 0,
        dailyAmount: dailyAmount || 0,
      };
    } else {
      // Add new entry
      booking.invoiceDetails.push({
        date: searchDateObj,
        totalPaid: totalPaid || 0,
        dailyAmount: dailyAmount || 0,
      });
    }

    // Calculate total paid so far
    const sumTotalPaid = booking.invoiceDetails.reduce(
      (sum, entry) => sum + (entry.totalPaid || 0),
      0
    );

    // Update main booking fields
    booking.totalPaid = sumTotalPaid;
    booking.dailyAmount = dailyAmount || 0;
    booking.dueAmount = booking.totalBill - sumTotalPaid;

    // Save updated booking
    const updatedBooking = await booking.save();

    // Update the linked invoice (if available)
    if (booking.invoice) {
      booking.invoice.totalPaid = sumTotalPaid;
      booking.invoice.dueAmount = booking.totalBill - sumTotalPaid;
      booking.invoice.dailyAmount = dailyAmount || 0;

      await booking.invoice.save();
    }

    res.status(200).json({
      message: "Booking and invoice updated successfully",
      booking: updatedBooking,
      invoice: booking.invoice || null,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(400).json({
      error: "Failed to update booking",
      details: error.message,
    });
  }
};

// @desc Get daily summary for a specific date
// @route GET /api/daily-summary/:date
const getDailySummary = async (req, res) => {
  const { date } = req.params;

  try {
    // Validate date format
    if (!dayjs(date, "YYYY-MM-DD", true).isValid()) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    // 1. Get previous day's closing balance
    const prevDate = dayjs(date).subtract(1, "day").format("YYYY-MM-DD");
    const prevDaySummary = await Booking.aggregate([
      {
        $match: {
          $or: [
            { checkInDate: { $lte: new Date(prevDate) } },
            { checkOutDate: { $gte: new Date(prevDate) } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$dailyAmount" },
          totalExpenses: { $sum: 0 }, // Currently 0 as per requirements
          closingBalance: {
            $sum: {
              $subtract: [
                { $sum: "$dailyAmount" },
                0, // Expenses currently 0
              ],
            },
          },
        },
      },
    ]);

    const openingBalance =
      prevDaySummary.length > 0 ? prevDaySummary[0].closingBalance : 0;

    // 2. Get today's daily income (sum of all dailyAmounts for the date)
    const currentDateStart = dayjs(date).startOf("day").toDate();
    const currentDateEnd = dayjs(date).endOf("day").toDate();

    const todayBookings = await Booking.find({
      $or: [
        { checkInDate: { $lte: currentDateEnd } },
        { checkOutDate: { $gte: currentDateStart } },
      ],
    });

    const dailyIncome = todayBookings.reduce((sum, booking) => {
      const todaysPayment = booking.invoiceDetails?.find((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= currentDateStart && entryDate <= currentDateEnd;
      });
      return sum + (todaysPayment?.dailyAmount || 0);
    }, 0);

    // 3. Calculate other values
    const totalBalance = openingBalance + dailyIncome;
    const dailyExpenses = 0; // Temporary as per requirements
    const closingBalance = totalBalance - dailyExpenses;

    // Prepare response
    const response = {
      date,
      openingBalance,
      dailyIncome,
      totalBalance,
      dailyExpenses,
      closingBalance,
      bookingsCount: todayBookings.length,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getDailySummary:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createBooking,
  updateBooking,
  getBookings,
  getBookingsByHotelId,
  getBookingById,
  deleteBooking,
  getBookingsByBookingNo,
  updateStatusID,
  getBookingsByCheckInDate,
  updateBookingDetails,
  getDailySummary, // Add this line
};
