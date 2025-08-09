const { readJsonFile } = require("../models/jsonFunction");
const path = require("path");
const User = require("../models/User");
const { useMongoDB, jsonFiles } = require("../config");

const usersFile = path.join(__dirname, "../data", jsonFiles.users);

const verifyAuthenticated = (req, res, next) => {
    if (!req.session.username) {
        if (req.path !== "/login" && req.path !== "/register" && req.path !== "/preview") {
            return res.redirect("/preview");
        }
    } else {
        if (req.path === "/login" || req.path === "/register" || req.path === "/preview") {
            return res.redirect("/");
        }
    }
    next();
};

const verifyAdmin = (req, res, next) => {
    if (!req.session.username || req.session.userType !== "admin") {
        return res.redirect("/");
    }
    next();
};

const refreshUserSession = async (req, res, next) => {
    if (req.session.username) {
        let user;
        try {
            if (useMongoDB) {
                user = await User.findOne({ username: req.session.username });
            } else {
                const userData = readJsonFile(usersFile);
                user = userData.find(u => u.username === req.session.username);
            }

            if (!user) {
                req.session.destroy(err => {
                    if (err) {
                        console.error("Error destroying session:", err);
                        return res.status(500).json({ message: "Error logging out deleted user" });
                    }
                    return res.redirect("/logout");
                });

                return;
            } else {
                req.session.userType = user.type;
                res.locals.userType = user.type;
            }
        } catch (error) {
            console.error("Error refreshing user session:", error);
        }
    }
    next();
};

module.exports = { refreshUserSession, verifyAuthenticated, verifyAdmin };