const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Function to generate unique loginID like FTB-{random4digits}
function generateLoginID() {
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
  return `FTB-${randomDigits}`;
}

// Register a new user
// Register a new user
// Register a new user
const register = async (req, res) => {
  const {
    image,
    username,
    gender,
    email,
    password,
    plainPassword,
    phoneNumber,
    currentAddress,
    role,
    loginID,
  } = req.body;

  // Check for required fields
  const requiredFields = [
    "username",
    "gender",
    "email",
    "password",
    "phoneNumber",
    "currentAddress",
    "role",
    "loginID",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length) {
    return res
      .status(400)
      .json({ error: `Missing required fields: ${missingFields.join(", ")}` });
  }

  try {
    // Generate unique loginID
    // const loginID = generateLoginID();

    const roleInfo = {
      label: role.label,
      value: role.value,
    };

    // Create the new user with timestamps
    const user = await User.create({
      image,
      username,
      gender,
      email,
      password, // Will be hashed before saving
      plainPassword,
      phoneNumber,
      currentAddress,
      role: roleInfo,
      loginID, // Store the generated loginID
    });

    // Send a confirmation message with created date and time
    res.status(200).json({
      message: "Registration successful. Please log in to continue.",
      createdAt: user.createdAt, // Include created date and time in the response
    });
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const duplicateFields = Object.keys(error.keyValue).join(", ");
      return res
        .status(400)
        .json({ error: `Duplicate fields found: ${duplicateFields}` });
    }
    res.status(400).json({ error: error.message });
  }
};

// User login with loginID
const login = async (req, res) => {
  const { loginID, password } = req.body;

  try {
    const user = await User.findOne({ loginID });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        loginID: user.loginID,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        currentAddress: user.currentAddress,
        role: user.role,
        image: user.image,
        hotelID: user.hotelID,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    // Fetch users sorted by creation date (newest first)

    const users = await User.find({ statusID: { $ne: 255 } }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      users: users.map((user) => ({
        id: user._id,
        loginID: user.loginID,
        gender: user.gender,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        nid: user.nid,
        currentAddress: user.currentAddress,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt, // Include createdAt in the response
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update user information
const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    image,
    username,
    gender,
    email,
    phoneNumber,
    nid,
    currentAddress,

    role,
  } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        image,
        username,
        gender,
        email,
        phoneNumber,
        nid,

        currentAddress,
        role: {
          label: role.label,
          value: role.value,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        id: updatedUser._id,
        loginID: updatedUser.loginID,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        nid: updatedUser.nid,
        currentAddress: updatedUser.currentAddress,
        role: updatedUser.role,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
// Soft Delete (mark as deleted with statusID=255)
// Update statusID to 255
const updateStatusID = async (req, res) => {
  const { id } = req.params;

  try {
    // Use runValidators to enforce schema validation on updates
    const user = await User.findByIdAndUpdate(
      id,
      { statusID: 255 },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User status updated to 255.",
      updatedUser: user, // Optionally include the updated user object for debugging
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Hard Delete (completely remove user)
const mongoose = require("mongoose");

const hardDeleteUser = async (req, res) => {
  const { id } = req.params;
  const { deletedBy } = req.body; // The user who performs the delete action

  try {
    // Validate MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }

    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Track deletion information
    const deletionInfo = {
      deletedBy, // Track who deleted the user
      deletedAt: new Date(), // Track when the deletion occurred
    };

    // Perform hard delete using findByIdAndDelete
    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "User permanently deleted.",
      ...deletionInfo,
    });
  } catch (error) {
    console.error("Error in hardDeleteUser:", error); // Log the error
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  updateUser,
  updateStatusID,
  hardDeleteUser,
};
