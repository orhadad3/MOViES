const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// Route to render the login page
router.get('/login', usersController.redirectIfAuthenticated, usersController.renderLoginPage);

// Route to handle login submissions
router.post('/login', usersController.handleLogin);

// Route to handle user logout
router.get('/logout', usersController.handleLogout);

// Route to render the registration page
router.get('/register', usersController.redirectIfAuthenticated, usersController.renderRegisterPage);

// Route to handle registration submissions
router.post('/register', usersController.handleRegister);

module.exports = router;