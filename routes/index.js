const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { title: 'MOViES - Home', activePage: 'home' });
});

module.exports = router;