const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * Authentication Routes
 */

// POST /api/auth/login - Admin login
router.post('/login', AuthController.login);

// POST /api/auth/employee-login - Employee login
router.post('/employee-login', AuthController.employeeLogin);

// POST /api/auth/freelancer-login - Freelancer login
router.post('/freelancer-login', AuthController.freelancerLogin);

// GET /api/auth/verify - Verify token
router.get('/verify', authMiddleware, AuthController.verifyToken);

module.exports = router;
