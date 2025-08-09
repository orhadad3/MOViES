const path = require('path');
const { readJsonFile } = require('../models/jsonFunction');
const { useMongoDB, jsonFiles } = require('../config');
const Link = require("../models/Link");
const Review = require("../models/Review");

/**
 * Render the Favorites page
*/

exports.renderTopLinkPage = async (req, res) => {
    res.render('top-links', {
        title: 'MOViES - Top Links',
        activePage: 'top-links'
    });
};

exports.getTopLinks = async (req, res) => {
    try {
        let links = [];

        if (useMongoDB) {
            links = await Link.find({ isPublic: true }).lean();
        } else {
            const jsonData = readJsonFile("data/" + jsonFiles.links, []);
            links = jsonData.filter(link => link.isPublic);
        }
        
        const movieLinks = {};

        for (const link of links) {
            let reviews = [];

            if (useMongoDB) {
                reviews = await Review.find({ linkId: link._id });
            } else {
                const jsonReviews = readJsonFile("data/" + jsonFiles.reviews, { reviews: [] });
                reviews = jsonReviews.reviews.filter(review => review.linkId === link.id);
            }

            const avgRating = reviews.length
                ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
                : 0;

            link.avgRating = avgRating;

            if (!movieLinks[link.movieId] || movieLinks[link.movieId].avgRating < avgRating) {
                movieLinks[link.movieId] = link;
            }
        }

        const sortedLinks = Object.values(movieLinks).sort((a, b) => b.avgRating - a.avgRating);

        res.json(sortedLinks);
    } catch (error) {
        console.error("Error fetching top links:", error);
        res.status(500).json({ error: "Server error" });
    }
};