const path = require('path');
const { readJsonFile, writeJsonFile } = require('../models/jsonFunction');
const { useMongoDB, jsonFiles } = require('../config');
const { randomUUID } = require('crypto');

let Review;
let reviewFilePath;

if(useMongoDB) {
    Review = require("../models/Review");
} else {
    reviewFilePath = path.join(__dirname, '../data', jsonFiles.reviews);

    try {
        let jsonData = readJsonFile(reviewFilePath);
        if (!jsonData || !jsonData.reviews || !Array.isArray(jsonData.reviews)) {
            jsonData = { reviews: [] };
            writeJsonFile(reviewFilePath, jsonData);
        }
    } catch (error) {
        console.error(`Failed to open ${jsonFiles.reviews}. Creating a new empty file.`);
        writeJsonFile(reviewFilePath, { reviews: [] });
    }
}


exports.addReview = async (req, res) => {
    try {
        const username = req.session.username;
        let { linkId, rating, comment } = req.body;

        if (!linkId || !rating) {
            return res.status(400).json({ message: "All fields are required." });
        }

        rating = Number(rating);
        
        const newReview = {
            id: useMongoDB ? undefined : randomUUID(),
            linkId,
            username: req.session.username,
            rating,
            comment,
            createdAt: new Date()
        };

        if(useMongoDB) {
            const existingReview = await Review.findOne({ linkId, username });
            if (existingReview) {
                return res.status(400).json({ message: "You have already reviewed this link" });
            }

            const reviewObject = new Review(newReview);
            await reviewObject.save();
        } else {
            let jsonData = readJsonFile(reviewFilePath, { reviews: [] });

            if (jsonData.reviews.some(r => r.linkId === linkId && r.username === username)) {
                return res.status(400).json({ message: "You have already reviewed this link" });
            }

            jsonData.reviews.push(newReview);
            writeJsonFile(reviewFilePath, jsonData);
        }

        return res.status(201).json({ newReview, useMongoDB });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "Error adding review", error });
    }
};

exports.getReviews = async (req, res) => {
    try {
        const { linkId } = req.params;
        let reviews = [];

        if (useMongoDB) {
            reviews = await Review.find({ linkId });
        } else {
            let jsonData = readJsonFile(reviewFilePath, { reviews: [] });
            reviews = jsonData.reviews.filter(r => r.linkId === linkId);
        }
        
        res.json({ reviews, username: req.session.username, useMongoDB });
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const username = req.session.username;

        if (useMongoDB) {
            const review = await Review.findById(reviewId);
            if (!review) {
                return res.status(404).json({ message: "Review not found" });
            }

            if (review.username !== username) {
                return res.status(403).json({ message: "You are not allowed to delete this review" });
            }

            await Review.findByIdAndDelete(reviewId);
        } else {
            let jsonData = readJsonFile(reviewFilePath, { reviews: [] });

            const reviewIdx = jsonData.reviews.findIndex(r => r.id === reviewId && r.username === username);

            if (reviewIdx === -1) {
                return res.status(404).json({ message: "Review not found or unauthorized" });
            }

            jsonData.reviews.splice(reviewIdx, 1);
            writeJsonFile(reviewFilePath, jsonData);
        }

        res.json({ message: "Review deleted successfully", useMongoDB });
    } catch (error) {
        console.error("Error deleting review: ", error);
        res.status(500).json({ message: "Server error" });
    }
};