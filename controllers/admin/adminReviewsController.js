const path = require("path");
const { useMongoDB, jsonFiles } = require("../../config");
const { readJsonFile, writeJsonFile } = require("../../models/jsonFunction");

let Review;
let reviewsFile, linksFile;

if (useMongoDB) {
    Review = require("../../models/Review");
} else {
    reviewsFile = path.join(__dirname, "../../data", jsonFiles.reviews);
    linksFile = path.join(__dirname, "../../data", jsonFiles.links);
}

exports.getAllReviews = async (req, res) => {
    try {
        let reviews = [];

        if (useMongoDB) {
            reviews = await Review.aggregate([
                {
                    $lookup: {
                        from: "links",
                        localField: "linkId",
                        foreignField: "_id",
                        as: "linkDetails"
                    }
                },
                {
                    $unwind: "$linkDetails"
                },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        rating: 1,
                        comment: 1,
                        createdAt: 1,
                        "linkDetails.name": 1,
                        "linkDetails.movieId": 1,
                        "linkDetails.isPublic": 1,
                        "linkDetails.url": 1
                    }
                },
                {
                    $sort: { rating: -1, createdAt: -1 }
                }
            ]);
        } else {
            const reviewsData = readJsonFile(reviewsFile);
            const linksData = readJsonFile(linksFile);

            reviews = reviewsData.reviews.map(review => {
                const link = linksData.find(link => link.id === review.linkId);
                return {
                    ...review,
                    linkDetails: {
                        name: link.name,
                        movieId: link.movieId,
                        isPublic: link.isPublic,
                        url: link.url
                    }
                };
            });
        }

        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Error fetching reviews" });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        if (useMongoDB) {
            const deletedReview = await Review.findByIdAndDelete(reviewId);

            if (!deletedReview) {
                return res.status(404).json({ message: "Review not found" });
            }
        } else {
            const reviewsData = readJsonFile(reviewsFile);
            const reviewIndex = reviewsData.reviews.findIndex(review => review.id === reviewId);

            if (reviewIndex === -1) {
                return res.status(404).json({ message: "Review not found" });
            }
            reviewsData.reviews.splice(reviewIndex, 1);
            writeJsonFile(reviewsFile, reviewsData);
        }
        
        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Error deleting review" });
    }
};