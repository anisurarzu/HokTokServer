const Footer = require("../models/Footer");

// Create a new footer
exports.createFooter = async (req, res) => {
  try {
    const footer = new Footer(req.body);
    await footer.save();
    res.status(201).json({
      success: true,
      data: footer,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Get all footers
exports.getFooters = async (req, res) => {
  try {
    const footers = await Footer.find();
    res.status(200).json({
      success: true,
      data: footers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get a single footer by ID
exports.getFooter = async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id);
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: "Footer not found",
      });
    }
    res.status(200).json({
      success: true,
      data: footer,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update a footer
exports.updateFooter = async (req, res) => {
  try {
    const footer = await Footer.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: "Footer not found",
      });
    }
    res.status(200).json({
      success: true,
      data: footer,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete a footer
exports.deleteFooter = async (req, res) => {
  try {
    const footer = await Footer.findByIdAndDelete(req.params.id);
    if (!footer) {
      return res.status(404).json({
        success: false,
        message: "Footer not found",
      });
    }
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
