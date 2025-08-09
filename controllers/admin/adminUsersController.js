const path = require("path");
const { readJsonFile, writeJsonFile } = require("../../models/jsonFunction");
const { useMongoDB, jsonFiles } = require("../../config");

let User, Link, Favorite, Review;
let usersFile, linksFile, favoritesFile, reviewsFile;

if (useMongoDB) {
    User = require("../../models/User");
    Link = require("../../models/Link");
    Review = require("../../models/Review");
    Favorite = require("../../models/Favorite");
} else {
    usersFile = path.join(__dirname, "../../data", jsonFiles.users);
    linksFile = path.join(__dirname, "../../data", jsonFiles.links);
    favoritesFile = path.join(__dirname, "../../data", jsonFiles.userFavorites);
    reviewsFile = path.join(__dirname, "../../data", jsonFiles.reviews);
}

// Get all users
exports.getUsers = async (req, res) => {
    let users;
    try {
        if (useMongoDB) {
            users = await User.find();
            return res.json(users);
        } else {
            users = readJsonFile(usersFile) || [];
            return res.json(users);
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
};

// Update user (role or email)
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, type } = req.body;
        const currentUser = req.session.username;

        if (!email || !type) {
            return res.status(400).json({ message: "Email and User Type are required" });
        }

        let userToUpdate;

        if (useMongoDB) {
            userToUpdate = await User.findById(userId);

            if (!userToUpdate) return res.status(404).json({ message: "User not found" });

            if (userToUpdate.username === currentUser && userToUpdate.type !== type) {
                return res.status(403).json({ message: "You cannot change your own user role." });
            }

            const emailExists = await User.findOne({ email, _id: { $ne: userToUpdate._id } });
            if (emailExists) {
                return res.status(400).json({ message: "This email is already in use by another user." });
            }

            const oldValues = {
                email: userToUpdate.email,
                type: userToUpdate.type
            };

            userToUpdate.email = email;
            userToUpdate.type = type;

            await userToUpdate.save();
        } else {
            let users = readJsonFile(usersFile) || [];

            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) {
                return res.status(404).json({ message: "User not found" });
            }

            userToUpdate = users[userIndex];

            if (userToUpdate.username === currentUser && userToUpdate.type !== type) {
                return res.status(403).json({ message: "You cannot change your own user role." });
            }

            if (users.some(u => u.email === email && u.id !== userId)) {
                return res.status(400).json({ message: "This email is already in use by another user." });
            }

            users[userIndex].email = email;
            users[userIndex].type = type;
            writeJsonFile(usersFile, users);
        }
        res.json({ userToUpdate, message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Error updating user" });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.session.username;
        let username;

        if (useMongoDB) {
            const userToDelete = await User.findById(userId);

            if (!userToDelete) {
                return res.status(404).json({ message: "User not found" });
            }

            if (userToDelete.username === currentUser) {
                return res.status(403).json({ message: "You cannot delete your own account." });
            }

            username = userToDelete.username;

            await Link.deleteMany({ user: username });
            await Review.deleteMany({ username });
            await Favorite.deleteMany({ username });
            await User.findByIdAndDelete(userId);
        } else {
            let users = readJsonFile(usersFile) || [];
            let links = readJsonFile(linksFile) || [];
            let reviews = readJsonFile(reviewsFile).reviews || [];
            let favorites = readJsonFile(favoritesFile) || {};

            const userIndex = users.findIndex(user => user.id === userId);

            if (userIndex === -1) {
                return res.status(404).json({ message: "User not found" });
            }

            username = users[userIndex].username;

            if (username === currentUser) {
                return res.status(403).json({ message: "You cannot delete your own account." });
            }

            users.splice(userIndex, 1);

            const updatedLinks = links.filter(link => link.user !== username);
            const updatedReviews = reviews.filter(review => review.username !== username);
            delete favorites[username];

            writeJsonFile(usersFile, users);
            writeJsonFile(linksFile, updatedLinks);
            writeJsonFile(reviewsFile, { reviews: updatedReviews });
            writeJsonFile(favoritesFile, favorites);
        }

        res.json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
        console.error("Error deleting user and associated data:", error);
        res.status(500).json({ message: "Error deleting user and associated data" });
    }
};