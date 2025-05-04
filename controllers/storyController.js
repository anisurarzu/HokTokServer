const Story = require("../models/Story");

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const { title, subtitle, description, otherDescription, images } = req.body;

    if (!images || images.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide at least one image" });
    }

    if (images.length > 3) {
      return res.status(400).json({ message: "Maximum 3 images allowed" });
    }

    const story = new Story({
      title,
      subtitle,
      description,
      otherDescription,
      images,
    });

    await story.save();

    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all stories
exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single story
exports.getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.status(200).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update story
exports.updateStory = async (req, res) => {
  try {
    const { title, subtitle, description, otherDescription, images } = req.body;

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Update images if new ones are provided
    if (images && images.length > 0) {
      if (images.length > 3) {
        return res.status(400).json({ message: "Maximum 3 images allowed" });
      }
      story.images = images;
    }

    story.title = title || story.title;
    story.subtitle = subtitle || story.subtitle;
    story.description = description || story.description;
    story.otherDescription = otherDescription || story.otherDescription;
    story.updatedAt = Date.now();

    await story.save();

    res.status(200).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
