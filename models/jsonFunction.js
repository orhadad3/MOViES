const fs = require('fs');
const path = require('path');

/**
 * Function to safely read and parse a JSON file.
 */
function readJsonFile(filePath, defaultContent = {}) {
    try {
        const resolvedPath = path.resolve(filePath);

        // Check if the file exists
        if (!fs.existsSync(resolvedPath)) {
            // Create the file with default content
            fs.writeFileSync(resolvedPath, JSON.stringify(defaultContent, null, 2), 'utf-8');
            return defaultContent; // Return the default content
        }

        const fileContent = fs.readFileSync(resolvedPath, 'utf-8');

        // If the file is empty, initialize it with default content
        if (!fileContent.trim()) {
            fs.writeFileSync(resolvedPath, JSON.stringify(defaultContent, null, 2), 'utf-8');
            return defaultContent;
        }

        return JSON.parse(fileContent);
    } catch (error) {
        if (error.name === 'SyntaxError') {
            throw new Error(`Invalid JSON format in file: ${filePath}`);
        } else {
            throw new Error(`Error reading file: ${error.message}`);
        }
    }
}


/**
 * Function to safely write data to a JSON file.
*/
function writeJsonFile(filePath, data) {
    try {
        const resolvedPath = path.resolve(filePath);
        const jsonData = JSON.stringify(data, null, 2); // Format JSON with indentation
        fs.writeFileSync(resolvedPath, jsonData, 'utf-8');
    } catch (error) {
        throw new Error(`Error writing file: ${error.message}`);
    }
}

module.exports = {
    readJsonFile,
    writeJsonFile,
};
