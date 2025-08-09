const path = require('path');
const { readJsonFile, writeJsonFile } = require('../models/jsonFunction');
const { useMongoDB, jsonFiles } = require('../config');
const Link = require('../models/Link');
const Review = require('../models/Review');
const { randomUUID } = require('crypto');

let linkFilePath;
if (!useMongoDB) {
    linkFilePath = path.join(__dirname, '../data', jsonFiles.links);
    reviewFilePath = path.join(__dirname, '../data', jsonFiles.reviews);
}

exports.getMovieLinks = async (req, res) => {
    const username = req.session.username;
    const movieId = req.params.movieId;
    try {
        let links;
        if (useMongoDB) {
            links = await Link.aggregate([
                {
                    $match: { 
                        movieId: movieId,
                        $or: [{ user: username }, { isPublic: true }]
                    } 
                },
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
                        avgRating: {
                            $cond: [
                                { $gt: [ { $size: "$reviews" }, 0 ] },
                                { $avg: "$reviews.rating" },
                                null
                            ]
                        }
                    }
                }
            ]);
        } else {
            links = readJsonFile(linkFilePath).filter(link =>
                link.movieId === movieId && (link.user === username || link.isPublic)
            );

            const reviewsData = readJsonFile(path.join(__dirname, '../data', jsonFiles.reviews), { reviews: [] }).reviews;
            // For each link, compute its average rating:
            links = links.map(link => {
                const reviewsForLink = reviewsData.filter(r => r.linkId === link.id);
                if (reviewsForLink.length > 0) {
                    const avg = reviewsForLink.reduce((acc, cur) => acc + parseFloat(cur.rating), 0) / reviewsForLink.length;
                    return { ...link, avgRating: avg };
                } else {
                    return { ...link, avgRating: null };
                }
            });
        }

        res.json({ username, links, useMongoDB });
    } catch (error) {
        console.error('Error getting links:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.updateLink = async (req, res) => {
    const username = req.session.username;
    const movieId = req.params.movieId;
    const { linkId, updatedLink } = req.body;

    try {
        if (useMongoDB) {
            let link;
            if (linkId) {
                link = await Link.findOneAndUpdate(
                    { _id: linkId, user: username },
                    { $set: updatedLink },
                    { new: true }
                );
            } else {
                link = await new Link({ ...updatedLink, user: username, movieId }).save();
            }
            if (!link) {
                return res.status(404).json({ error: 'Link not found or not authorized.' });
            }
        } else {
            let links = readJsonFile(linkFilePath, []);
            let linkIndex = links.findIndex(
                link => link.id === linkId && link.user === username
            );
            if (linkIndex !== -1) {
                links[linkIndex] = { ...links[linkIndex], ...updatedLink };
            } else {
                links.push({ id: randomUUID(), ...updatedLink, user: username, movieId, addedDate: new Date() });
            }
            writeJsonFile(linkFilePath, links);
        }
        res.json({ message: 'Link updated successfully.', link: updatedLink });
    } catch (error) {
        console.error('Error updating link:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.deleteLink = async (req, res) => {
    const username = req.session.username;
    const linkId = req.params.linkId;

    try {
        if (!linkId) {
            return res.status(400).json({ error: 'Invalid link ID.' });
        }

        if (useMongoDB) {
            const link = await Link.findOne({ _id: linkId, user: username });
            
            if (!link) {
                return res.status(404).json({ error: 'Link not found or not authorized.' });
            }

            // Delete associated reviews first
            await Review.deleteMany({ linkId: linkId });

            // Delete the link
            await Link.findByIdAndDelete(linkId);
        } else {
            let links = readJsonFile(linkFilePath);
            const linkToDelete = links.find(link => link.id === linkId && link.user === username);

            if (!linkToDelete) {
                return res.status(400).json({ error: 'Invalid link ID or unauthorized action.' });
            }

            // Filter out the link
            let filteredLinks = links.filter(link => link.id !== linkId || link.user !== username);
            writeJsonFile(linkFilePath, filteredLinks);

            // Delete associated reviews
            let reviewsData = readJsonFile(reviewFilePath, { reviews: [] });
            let filteredReviews = reviewsData.reviews.filter(review => review.linkId !== linkId);
            
            writeJsonFile(reviewFilePath, { reviews: filteredReviews });
        }
        
        res.json({ message: 'Link and associated reviews deleted successfully.' });
    } catch (error) {
        console.error('Error deleting link and reviews: ', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.getLinkData = async (req, res) => {
    try {
        const { linkId } = req.params;

        if (useMongoDB) {
            const link = await Link.findById(linkId);

            if (!link) {
                return res.status(404).json({ message: 'Link not found' });
            }

            return res.json(link);
        } else {
            const linksData = readJsonFile(linkFilePath, []);
            const link = linksData.find((l) => l.id === linkId);

            if (!link) {
                return res.status(404).json({ message: 'Link not found in JSON' });
            }
            
            res.json(link);
        }
    } catch (error) {
        console.error('Error fetching link:', error);
        res.status(500).json({ message: 'Server error' });
    }
};