const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('404', { title: 'MOViES - 404', activePage: '404' });
});

module.exports = router;