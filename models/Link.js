const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    name: String,
    description: String,
    url: String,
    user: String,
    movieId: String,
    isPublic: {
        type: Boolean,
        default: false
    },
    addedDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Link', linkSchema);