const { randomUUID } = require('crypto');
const path = require('path');
const { readJsonFile, writeJsonFile } = require('../models/jsonFunction');
const mongoose = require('mongoose');
const { useMongoDB, jsonFiles } = require('../config');
const User = useMongoDB ? require('../models/User') : null;

// Full path to the users.json file (for JSON-based storage)
const usersFilePath = path.join(__dirname, '../data', jsonFiles.users);

/**
 * Utility function to validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Returns true if the email format is valid
*/
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Utility function to validate password strength
 * @param {string} password - The password to validate
 * @returns {boolean} - Returns true if the password meets the criteria
*/
const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\W_]).{6,15}$/;
    return passwordRegex.test(password);
};

/**
 * Middleware to redirect authenticated users away from login/register pages
*/
exports.redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        return res.redirect('/');
    }
    next();
};

/**
 * Render the login page
*/
exports.renderLoginPage = (req, res) => {
    res.render('login', { error: null, formData: {}, successMessage: null });
};

/**
 * Handle login request
*/
exports.handleLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.render('login', {
                title: 'Login',
                error: 'Username and password cannot be empty.',
                formData: { username },
                successMessage: null
            });
        }

        let user;
        if(useMongoDB) {
            user = await User.findOne({ username, password });
        } else {
            const users = readJsonFile(usersFilePath, []);
            user = users.find(u => u.username === username && u.password === password);
        }

        if (!user) {
            return res.render('login', {
                title: 'Login',
                error: 'Invalid username or password.',
                formData: { username, password },
                successMessage: null
            });
        }

        req.session.isAuthenticated = true;
        req.session.username = username;
        req.session.userType = user.type;
        res.render('login', { error: null, formData: {}, successMessage: 'Logged in successfully!' });
    } catch (err) {
        console.error('Error handling login:', err);
        res.status(500).send('Internal server error');
    }
};

/**
 * Handle user logout
*/
exports.handleLogout = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Internal server error');
            }
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
};

/**
 * Render registration page
*/
exports.renderRegisterPage = (req, res) => {
    res.render('register', { error: null, successMessage: null, formData: {} });
};

/**
 * Handle registration request
*/
exports.handleRegister = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    try {
        let users;
        if (!useMongoDB) {
            users = readJsonFile(usersFilePath, []);
        }

        if (!username || username.length > 50) {
            return res.render('register', {
                error: 'Username must be less than 50 characters.',
                formData: { username, email, password, confirmPassword },
                successMessage: null
            });
        }
        if (!isValidEmail(email)) {
            return res.render('register', {
                error: 'Invalid email format.',
                formData: { username, email, password, confirmPassword },
                successMessage: null
            });
        }
        if (!isValidPassword(password)) {
            return res.render('register', {
                error: `Password must be 6-15 characters long,
                contain at least one uppercase letter,
                one lowercase letter, one number,
                and one special character.`,
                formData: { username, email, password, confirmPassword },
                successMessage: null
            });
        }
        if (password !== confirmPassword) {
            return res.render('register', {
                error: 'Passwords do not match.',
                formData: { username, email, password, confirmPassword },
                successMessage: null
            });
        }

        if (useMongoDB) {
            const usernameExsit = await User.exists({ username });
            const emailExist = await User.exists({ email });

            if (usernameExsit) {
                return res.render('register', {
                    error: 'Username already exists.',
                    formData: { username, email, password, confirmPassword },
                    successMessage: null
                });
            }

            if (emailExist) {
                return res.render('register', {
                    error: 'Email already exists.',
                    formData: { username, email, password, confirmPassword },
                    successMessage: null
                });
            }

            const newUser = new User({ username, email, password, type: 'user' });
            await newUser.save();
        } else {
            if (users.some(u => u.username === username)) {
                return res.render('register', {
                    error: 'Username already exists.',
                    formData: { username, email, password, confirmPassword },
                    successMessage: null
                });
            }

            if (users.some(u => u.email === email)) {
                return res.render('register', {
                    error: 'Email already exists.',
                    formData: { username, email, password, confirmPassword },
                    successMessage: null
                });
            }
    
            users.push({ id: randomUUID(), username, email, password, type: 'user', createdAt: new Date() });
            writeJsonFile(usersFilePath, users);
        }

        res.render('register', { successMessage: 'Registered successfully! Please log in.', formData: {}, error: null });
    } catch (err) {
        console.error('Error handling registration:', err);
        res.status(500).send('Internal server error');
    }
};