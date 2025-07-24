const express = require("express");
const router = express.Router();
const reviewsController = require("../../controllers/admin/adminReviewsController");

router.get("/", (req, res) => {
    res.render("admin/admin-reviews", { 
        title: "Reviews Management",
        adminPage: "reviews",
        activePage: "admin",
        userType: req.session.userType 
    });
});

router.get("/getReviews", reviewsController.getAllReviews);
router.delete("/deleteReview/:reviewId", reviewsController.deleteReview);

module.exports = router;