const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');

// Route to render the favorites page
router.get('/', favoritesController.renderFavoritesPage);

// Route to get all favorite movies of the user
router.get('/get-all', favoritesController.getAllFavorites);

// Route to add a movie to favorites
router.post('/add', favoritesController.addToFavorites);

// Route to remove a movie from favorites
router.delete('/remove/:id', favoritesController.deleteFromFavorites)

module.exports = router;