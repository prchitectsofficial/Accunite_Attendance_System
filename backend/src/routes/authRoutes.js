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

// GET /api/auth/check-portal-auth - Check portal SSO cookie
router.get('/check-portal-auth', async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        
        if (!token) {
            return res.json({ authenticated: false });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'AccuniteJWTSecretKey2026ChangeThis!');
        
        if (decoded.employee_code) {
            // User has employee code, return it for auto-login
            return res.json({
                authenticated: true,
                employee_code: decoded.employee_code,
                email: decoded.email,
                name: decoded.name
            });
        }
        
        res.json({ authenticated: false, reason: 'No employee code' });
    } catch (error) {
        console.error('Portal auth check error:', error);
        res.json({ authenticated: false, reason: 'Invalid token' });
    }
});

// POST /api/auth/portal-login - Auto-login from portal SSO (Employee privileges only)
router.post('/portal-login', async (req, res) => {
    try {
        const { employee_code } = req.body;
        
        if (!employee_code) {
            return res.status(400).json({ error: 'Employee code required' });
        }

        // Get employee
        const EmployeeModel = require('../models/EmployeeModel');
        const employee = await EmployeeModel.getByCode(employee_code);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Generate token with employee role (NOT admin)
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            {
                employee_code: employee.employee_code,
                name: employee.name,
                email: employee.email,
                role: 'employee'  // Employee privileges only
            },
            process.env.JWT_SECRET || 'AccuniteJWTSecretKey2026ChangeThis!',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                employee_code: employee.employee_code,
                name: employee.name,
                email: employee.email,
                role: 'employee'  // Employee privileges only
            }
        });
    } catch (error) {
        console.error('Portal login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
