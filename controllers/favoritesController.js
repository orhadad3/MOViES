const path = require('path');
const { readJsonFile, writeJsonFile } = require('../models/jsonFunction');
const { useMongoDB, jsonFiles } = require('../config');
const Favorite = useMongoDB ? require('../models/Favorite') : null;

// Corrected path for JSON storage (moved to the root directory)
const usersFavoritesFile = path.join(__dirname, '../data', jsonFiles.userFavorites);
let usersFavorites;

// Load favorites from JSON if using file-based storage
if (!useMongoDB) {
    try {
        usersFavorites = readJsonFile(usersFavoritesFile);
    } catch (error) {
        console.error(`Failed to open ${jsonFiles.userFavorites} file.`);
    }
}

/**
 * Render the Favorites page
*/
exports.renderFavoritesPage = (req, res) => {
    res.render('favorites', {
        title: 'MOViES - Favorites',
        activePage: 'favorites'
    });
};

/**
 * Get all favorites for a user
*/
exports.getAllFavorites = async (req, res) => {
    const username = req.session.username;

    if (!username) {
        console.error('Invalid username:', username);
        return res.status(400).json({ error: 'User not authenticated' });
    }

    try {
        let favorites;

        if (useMongoDB) {
            // Fetch favorites from MongoDB and convert to plain objects
            favorites = await Favorite.find({ username }).lean();
        } else {
            // Reload favorites from JSON file
            usersFavorites = readJsonFile(usersFavoritesFile);
            favorites = usersFavorites[username] || [];
        }

        res.json(favorites);
    } catch (error) {
        console.error('Error reading usersFavorites file:', error);
        res.status(500).json({ error: 'Failed to load favorites' });
    }
};

/**
 * Add a movie to the user's favorites
*/
exports.addToFavorites = async (req, res) => {
    const { movie } = req.body;
    const username = req.session.username;

    if (!movie || !username) {
        console.error('Invalid data:', { movie, username });
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        if (useMongoDB) {
            const exists = await Favorite.exists({ username, imdbid: movie.imdbid });
            if (!exists) {
                await Favorite.create({ username, imdbid: movie.imdbid });
            }
        } else {
            usersFavorites = readJsonFile(usersFavoritesFile);

            if (!usersFavorites || Array.isArray(usersFavorites)) {
                usersFavorites = {};
                writeJsonFile(usersFavoritesFile, usersFavorites);
            }

            if (!usersFavorites[username]) usersFavorites[username] = [];

            if (!usersFavorites[username].some(fav => fav.imdbid === movie.imdbid)) {
                usersFavorites[username].push({ imdbid: movie.imdbid, addedDate: new Date() });
                writeJsonFile(usersFavoritesFile, usersFavorites);
            }
        }

        res.json({ success: true, message: 'Movie added to favorites' });
    } catch (error) {
        console.error('Error updating favorites:', error);
        res.status(500).json({ error: 'Failed to update favorites' });
    }
};

/**
 * Remove a movie from the user's favorites
*/
exports.deleteFromFavorites = async (req, res) => {
    const username = req.session.username;
    const movieId = req.params.id;
    try {
        if (useMongoDB) {
            await Favorite.deleteOne({ username, imdbid: movieId });
        } else {
            usersFavorites = readJsonFile(usersFavoritesFile);

            if (!usersFavorites[username]) {
                console.log(`No favorites found for user: ${username}`);
                return res.status(404).json({ error: 'No favorites found' });
            }

            usersFavorites[username] = usersFavorites[username].filter(fav => fav.imdbid !== movieId);
            writeJsonFile(usersFavoritesFile, usersFavorites);
        }

        res.json({ success: true, message: 'Movie removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
};