const express = require('express');
const router = express.Router();
const detailsController = require('../controllers/detailsController');

// GET route to check if a movie is in the user's favorites
router.get('/check-movie/:id', detailsController.checkIfFavorite);

// GET route to retrieve a specific movie's details
router.get('/get-movie/:id', detailsController.getMovieDetails);

// Route to render the movie details page
router.get('/:id', detailsController.renderDetailsPage);

module.exports = router;
