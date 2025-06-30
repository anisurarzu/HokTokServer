const express = require("express");
const router = express.Router();
const footerController = require("../controllers/footerController");

// Create a new footer
router.post("/", footerController.createFooter);

// Get all footers
router.get("/", footerController.getFooters);

// Get a single footer by ID
router.get("/:id", footerController.getFooter);

// Update a footer
router.put("/:id", footerController.updateFooter);

// Delete a footer
router.delete("/:id", footerController.deleteFooter);

module.exports = router;
