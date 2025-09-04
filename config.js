const path = require('path');
const fs = require('fs');
const { readJsonFile } = require('./models/jsonFunction');

module.exports = {
    useMongoDB: true, // Change this value to switch between MongoDB and JSON
    mongoUrl: "Connection String HERE!", // MongoDB connection string

    // JSON file paths (used only if useMongoDB is false)
    jsonFiles: {
        users: "users.json",
        userFavorites: "usersFavorites.json",
        links: "links.json",
        reviews: "reviews.json"
    }
};

// Ensure JSON files exist when using JSON-based storage
if (!module.exports.useMongoDB) {
    const dataDir = path.join(__dirname, 'data');

    // Ensure the 'data' directory exsits
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    // Function to check and create JSON files using readJsonFile
    const ensureFileExists = (fileName, defaultContent = []) => {
        const filePath = path.join(dataDir, fileName);
        readJsonFile(filePath, defaultContent); // This will create the file if it doesnt exist
    };

    Object.values(module.exports.jsonFiles).forEach(file => ensureFileExists(file));
}
