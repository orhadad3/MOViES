const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('preview');
});

module.exports = router;