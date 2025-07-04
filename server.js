const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sliderRoutes = require("./routes/sliderRoutes");
const storyRoutes = require("./routes/storyRoutes");
const footerRoutes = require("./routes/footerRoutes"); // Add this line

require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/footer", footerRoutes); // Add this line

// Root Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
