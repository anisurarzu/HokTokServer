const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");

// Create a new story
router.post("/", storyController.createStory);

// Get all stories
router.get("/", storyController.getAllStories);

// Get single story
router.get("/:id", storyController.getStory);

// Update story
router.put("/:id", storyController.updateStory);

// Delete story
router.delete("/:id", storyController.deleteStory);

module.exports = router;
