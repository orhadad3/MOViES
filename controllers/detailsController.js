const path = require('path');
const { readJsonFile, writeJsonFile } = require('../models/jsonFunction');
const { useMongoDB, jsonFiles } = require('../config');
const Favorite = useMongoDB ? require('../models/Favorite') : null;

// Corrected path for JSON storage (moved to the root directory)
const usersFavoritesFile = path.join(__dirname, '../data', jsonFiles.userFavorites);
let usersFavorites = {};

if (!useMongoDB) {
  try {
    usersFavorites = readJsonFile(usersFavoritesFile);
  } catch (error) {
    console.error('Failed to open favorites file.');
  }
}

/**
  * Check if a movie exists in the user's favorites
  * @param {string} username - The username of the user
  * @param {string} movieId - The IMDB ID of the movie
  * @returns {Promise<boolean>} - Returns true if the movie exists, false otherwise
*/
async function movieExists(username, movieId) {
  if (useMongoDB) {
    return await Favorite.exists({ username: String(username), imdbid: String(movieId) });
  }
  return usersFavorites[username]?.some(fav => fav.imdbid === movieId);
}

/**
 * Render the movie details page
*/
exports.renderDetailsPage = (req, res) => {
  res.render('details', {
    title: 'MOViES - Details',
    activePage: ''
  });
};

/**
 * Check if a movie is in the user's favorites
*/
exports.checkIfFavorite = async (req, res) => {
  const username = req.session.username;
  const movieId = req.params.id;
  let isFavorite = false;

  try {
    if (useMongoDB) {
      isFavorite = await movieExists(username, movieId);
    } else {
        usersFavorites = readJsonFile(usersFavoritesFile);
      if (usersFavorites[username]) {
        isFavorite = await movieExists(username, movieId);
      }
    }

    res.json({ isFavorite })
  } catch (error) {
    console.error('Error checking favorites:', error);
  }
};

/**
 * Retrieve details of a movie from the user's favorites
*/
exports.getMovieDetails = async (req, res) => {
  const username = req.session.username;
  const movieId = req.params.id;

  try {
    let movieDetails;

    if (useMongoDB) {
      movieDetails = await Favorite.findOne({ username, imdbid: movieId });
    } else {
      movieDetails = usersFavorites[username]?.find((movie) => movie.imdbid === movieId);
    }

    if (allMovie) {
      res.json({ allMovie });
    } else {
      console.error('Cannot retrieve movie.');
      res.status(404).json({ error: 'Movie not found' });
    }
  } catch (error) {
    console.error('Error getting movie details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};