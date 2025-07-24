const express = require('express');
const router = express.Router();
const linksController = require('../controllers/linksController');

// GET route to retrieve links for a specific movie.
// The movie ID is passed as the "movieId" parameter.
router.get('/:movieId', linksController.getMovieLinks);

// PUT route to update (or add) a link for a movie.
// Expects the movie ID in the route and { linkId, updatedLink } in the body.
router.put('/:movieId', linksController.updateLink);

// DELETE route to delete a specific link by its link ID.
router.delete('/:linkId', linksController.deleteLink);

// GET route to retrieve specific link data.
router.get('/get-link/:linkId', linksController.getLinkData);

module.exports = router;