const path = require("path");
const { useMongoDB, jsonFiles } = require("../../config");
const { readJsonFile, writeJsonFile } = require("../../models/jsonFunction");

let Link, Review;
let linksFile, reviewsFile;

if (useMongoDB) {
    Link = require("../../models/Link");
    Review = require("../../models/Review");
} else {
    linksFile = path.join(__dirname, "../../data", jsonFiles.links);
    reviewsFile = path.join(__dirname, "../../data", jsonFiles.reviews);
}

exports.getPublicLinks = async (req, res) => {
    try {
        let links = [];

        if (useMongoDB) {
            links = await Link.aggregate([
                { $match: { isPublic: true } },
                {
                    $lookup: {
                        from: "reviews",
                        localField: "_id",
                        foreignField: "linkId",
                        as: "reviews"
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: "$reviews.rating" }
                    }
                },
                { $sort: { avgRating: -1 } },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        movieId: 1,
                        user: 1,
                        addedDate: 1,
                        avgRating: { $ifNull: ["$avgRating", 0] }
                    }
                }
            ]);
        } else {
            const linksData = readJsonFile(linksFile);
            const reviewsData = readJsonFile(reviewsFile);

            links = linksData.map(link => {
                const linkReviews = reviewsData.reviews.filter(review => review.linkId === link.id);
                const avgRating = linkReviews.length ? linkReviews.reduce((acc, curr) => acc + curr.rating, 0) / linkReviews.length : 0;

                return {
                    ...link,
                    avgRating
                };
            });

            links.sort((a, b) => b.avgRating - a.avgRating);
        }

        res.json(links);
    } catch (error) {
        console.error("Error fetching public links:", error);
        res.status(500).json({ message: "Error fetching public links" });
    }
};

exports.deleteLink = async (req, res) => {
    try {
        const { linkId } = req.params;

        if (useMongoDB) {
            const deletedLink = await Link.findByIdAndDelete(linkId);

            if (!deletedLink) {
                return res.status(404).json({ message: "Link not found" });
            }

            await Review.deleteMany({ linkId });
        } else {
            const linksData = readJsonFile(linksFile);
            const linkIndex = linksData.findIndex(link => link.id === linkId);

            if (linkIndex === -1) {
                return res.status(404).json({ message: "Link not found" });
            }

            linksData.splice(linkIndex, 1);
            writeJsonFile(linksFile, linksData);

            const reviewsData = readJsonFile(reviewsFile);
            reviewsData.reviews = reviewsData.reviews.filter(review => review.linkId !== linkId);
            writeJsonFile(reviewsFile, reviewsData);
        }
        
        res.json({ message: "Link and associated reviews deleted successfully" });
    } catch (error) {
        console.error("Error deleting link and reviews:", error);
        res.status(500).json({ message: "Error deleting link and reviews" });
    }
};