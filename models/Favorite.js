const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    username: { type: String, required: true },
    imdbid: { type: String, required: true },
    addedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorite', favoriteSchema);