const path = require("path");
const { readJsonFile, writeJsonFile } = require("../../models/jsonFunction");
const { useMongoDB, jsonFiles, mongoUrl } = require("../../config");
const mongoose = require('mongoose');
const fs = require('fs');

let User, Link, Favorite, Review;
let usersFile, linksFile, favoritesFile, reviewsFile;

if (useMongoDB) {
    User = require("../../models/User");
    Link = require("../../models/Link");
    Favorite = require("../../models/Favorite");
    Review = require("../../models/Review");
} else {
    usersFile = path.join(__dirname, "../../data", jsonFiles.users);
    linksFile = path.join(__dirname, "../../data", jsonFiles.links);
    favoritesFile = path.join(__dirname, "../../data", jsonFiles.userFavorites);
    reviewsFile = path.join(__dirname, "../../data", jsonFiles.reviews);
}

exports.getAdminStats = async () => {
    try {
        let usersCount, linksCount, favoritesCount, reviewsCount;

        if (useMongoDB) {
            usersCount = await User.countDocuments();
            linksCount = await Link.countDocuments();
            favoritesCount = await Favorite.countDocuments();
            reviewsCount = await Review.countDocuments();
        } else {
            // Try both possible locations for users file
            let usersData = [];
            try {
                usersData = readJsonFile(usersFile, []);
            } catch (error) {
                // If data/users.json doesn't exist, try root level
                const rootUsersFile = path.join(__dirname, "../../", jsonFiles.users);
                try {
                    usersData = readJsonFile(rootUsersFile, []);
                } catch (rootError) {
                    console.warn('Users file not found in either location:', error.message, rootError.message);
                    usersData = [];
                }
            }
            usersCount = usersData.length || 0;

            const linksData = readJsonFile(linksFile, []);
            linksCount = linksData.length || 0;

            const favoritesData = readJsonFile(favoritesFile, {});
            favoritesCount = 0;
            Object.values(favoritesData).forEach(favs => {
                if (Array.isArray(favs)) {
                    favoritesCount += favs.length;
                }
            });
            
            const reviewsData = readJsonFile(reviewsFile, { reviews: [] });
            reviewsCount = reviewsData.reviews ? reviewsData.reviews.length : 0;
        }

        return {
            users: usersCount,
            links: linksCount,
            favorites: favoritesCount,
            reviews: reviewsCount
        };
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
    }
};

exports.getDatabaseInfo = async () => {
    try {
        let dbInfo = {
            type: useMongoDB ? "MongoDB" : "JSON Files",
            status: "Unknown",
            version: "N/A",
            collections: [],
            address: useMongoDB ? mongoUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : "./data/*.json"
        };

        if (useMongoDB) {
            try {
                // Check MongoDB connection status
                const connectionState = mongoose.connection.readyState;
                const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
                dbInfo.status = states[connectionState] || 'Unknown';
                
                if (connectionState === 1) { // Connected
                    // Get MongoDB version
                    const admin = mongoose.connection.db.admin();
                    const buildInfo = await admin.buildInfo();
                    dbInfo.version = buildInfo.version;
                    
                    // Get collections
                    const collections = await mongoose.connection.db.listCollections().toArray();
                    dbInfo.collections = collections.map(col => ({
                        name: col.name,
                        type: col.type || 'collection'
                    }));
                }
            } catch (error) {
                console.error("Error getting MongoDB info:", error);
                dbInfo.status = "Error";
            }
        } else {
            // JSON Files
            dbInfo.status = "Active";
            dbInfo.version = "File System";
            
            const dataDir = path.join(__dirname, "../../data");
            try {
                if (fs.existsSync(dataDir)) {
                    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
                    dbInfo.collections = files.map(file => ({
                        name: file,
                        type: 'json file'
                    }));
                }
                
                // Add root level files
                Object.values(jsonFiles).forEach(fileName => {
                    const filePath = path.join(__dirname, "../../", fileName);
                    if (fs.existsSync(filePath)) {
                        dbInfo.collections.push({
                            name: fileName,
                            type: 'json file (root)'
                        });
                    }
                });
            } catch (error) {
                console.error("Error reading JSON files:", error);
                dbInfo.status = "Error reading files";
            }
        }

        return dbInfo;
    } catch (error) {
        console.error("Error getting database info:", error);
        throw error;
    }
};

exports.getExternalAPIsStatus = async () => {
    const APIs = [
        {
            name: "OMDB API",
            testUrl: "http://www.omdbapi.com/?apikey=fca3b23c&t=test",
            description: "Movie Database API"
        },
        {
            name: "YouTube Data API",
            testUrl: "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=AIzaSyDZ7hhNm-YdfC3lb9uSrC8h8o6qh_IeqSk&maxResults=1",
            description: "YouTube Trailer API"
        }
    ];

    const results = await Promise.allSettled(
        APIs.map(async (api) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
                
                const response = await fetch(api.testUrl, {
                    method: 'GET',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                const isOnline = response.ok && response.status === 200;
                
                return {
                    ...api,
                    status: isOnline ? 'online' : 'error',
                    statusCode: response.status,
                    lastChecked: new Date()
                };
            } catch (error) {
                return {
                    ...api,
                    status: error.name === 'AbortError' ? 'timeout' : 'offline',
                    statusCode: 'N/A',
                    lastChecked: new Date()
                };
            }
        })
    );

    return results.map(result => result.value || result.reason);
};

exports.toggleDatabaseMode = async (req, res) => {
    try {
        const configPath = path.join(__dirname, "../../config.js");
        
        // Read current config file
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Toggle the useMongoDB value
        const currentValue = useMongoDB;
        const newValue = !currentValue;
        
        // Replace the useMongoDB value in the file
        configContent = configContent.replace(
            /useMongoDB:\s*(true|false)/,
            `useMongoDB: ${newValue}`
        );
        
        // Write the updated config back to file
        fs.writeFileSync(configPath, configContent, 'utf8');

        const isRunningWithPM2 = (
            process.env.pm2_server === 'true' || 
            process.env.PM2_HOME !== undefined || 
            process.env.pm_id !== undefined || 
            process.env.name !== undefined
        );

        if (isRunningWithPM2) {
            res.json({ 
                success: true, 
                message: `Database mode switched to ${newValue ? 'MongoDB' : 'JSON Files'}. Server is restarting...`,
                newMode: newValue ? 'MongoDB' : 'JSON Files',
                autoRestart: true
            });

            setTimeout(() => {
                process.exit(0); // Exit the process to apply changes
            }, 1000);
        } else {
            res.json({ 
                success: true, 
                message: `Database mode switched to ${newValue ? 'MongoDB' : 'JSON Files'}. Please restart the server for changes to take effect.`,
                newMode: newValue ? 'MongoDB' : 'JSON Files',
                autoRestart: false
            });
        }
    } catch (error) {
        console.error("Error toggling database mode:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to toggle database mode" 
        });
    }
};