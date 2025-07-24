const express = require('express');
const router = express.Router();
const topLinksController = require('../controllers/toplinksController');

// Route to render the Top Links page
router.get('/', topLinksController.renderTopLinkPage);

// Route to get all data
router.get('/data', topLinksController.getTopLinks);

module.exports = router;