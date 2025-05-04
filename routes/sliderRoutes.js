const express = require("express");
const router = express.Router();
const sliderController = require("../controllers/sliderController");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.array("images", 3), sliderController.createSlider);
router.get("/", sliderController.getAllSliders);
router.get("/:id", sliderController.getSlider);
router.put("/:id", upload.array("images", 3), sliderController.updateSlider);
router.delete("/:id", sliderController.deleteSlider);

module.exports = router;
