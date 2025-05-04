const Slider = require("../models/Slider");

// Create a new slider
exports.createSlider = async (req, res) => {
  try {
    const { title, subtitle, description, images } = req.body;

    if (!images || images.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide at least one image" });
    }

    if (images.length > 3) {
      return res.status(400).json({ message: "Maximum 3 images allowed" });
    }

    const slider = new Slider({
      title,
      subtitle,
      description,
      images,
    });

    await slider.save();

    res.status(201).json(slider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all sliders
exports.getAllSliders = async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ createdAt: -1 });
    res.status(200).json(sliders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single slider
exports.getSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }
    res.status(200).json(slider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update slider
exports.updateSlider = async (req, res) => {
  try {
    const { title, subtitle, description, images } = req.body;

    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    // Update images if new ones are provided
    if (images && images.length > 0) {
      if (images.length > 3) {
        return res.status(400).json({ message: "Maximum 3 images allowed" });
      }
      slider.images = images;
    }

    slider.title = title || slider.title;
    slider.subtitle = subtitle || slider.subtitle;
    slider.description = description || slider.description;
    slider.updatedAt = Date.now();

    await slider.save();

    res.status(200).json(slider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete slider
exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findByIdAndDelete(req.params.id);
    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }
    res.status(200).json({ message: "Slider deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
