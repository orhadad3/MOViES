const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.post("/", reviewController.addReview);
router.get("/:linkId", reviewController.getReviews);
router.delete("/delete-review/:reviewId", reviewController.deleteReview);

module.exports = router;
