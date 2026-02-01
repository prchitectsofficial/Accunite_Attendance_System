const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');
const FreelancerModel = require('../models/FreelancerModel');

/**
 * Authentication Controller
 * Handles admin login and authentication
 */
class AuthController {
    
    /**
     * Admin login
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Username and password are required'
                });
            }

            // Check if JWT_SECRET is set
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not set in environment variables');
                return res.status(500).json({
                    error: 'Server Configuration Error',
                    message: 'JWT_SECRET not configured. Please set it in .env file'
                });
            }

            // Get admin user
            const [users] = await promisePool.query(
                'SELECT * FROM admin_users WHERE username = ? AND status = ?',
                [username, 'active']
            );

            if (users.length === 0) {
                console.error(`Admin user not found: ${username}`);
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid username or password'
                });
            }

            const user = users[0];

            // For demo/development: allow plain text password 'admin123'
            let isValid = false;
            if (password === 'admin123' && user.username === 'admin') {
                isValid = true;
            } else {
                // Verify hashed password
                isValid = await bcrypt.compare(password, user.password_hash);
            }

            if (!isValid) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid username or password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    admin_id: user.admin_id,
                    username: user.username,
                    full_name: user.full_name
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    admin_id: user.admin_id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message || 'Login failed'
            });
        }
    }

    /**
     * Employee login
     */
    static async employeeLogin(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Email and password are required'
                });
            }

            // Get employee by email
            const [employees] = await promisePool.query(
                'SELECT * FROM employees WHERE email = ? AND status = ?',
                [email, 'active']
            );

            if (employees.length === 0) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            const employee = employees[0];

            // Check if password is set
            if (!employee.password_hash) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Password not set. Please contact admin.'
                });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, employee.password_hash);

            if (!isValid) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    employee_code: employee.employee_code,
                    name: employee.name,
                    email: employee.email,
                    role: 'employee'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    employee_code: employee.employee_code,
                    name: employee.name,
                    email: employee.email,
                    role: 'employee'
                }
            });
        } catch (error) {
            console.error('Employee login error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Login failed'
            });
        }
    }

    /**
     * Freelancer login
     */
    static async freelancerLogin(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Email and password are required'
                });
            }

            // Get freelancer by email
            const freelancer = await FreelancerModel.getByEmail(email);

            if (!freelancer) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            // Check if password is set
            if (!freelancer.password_hash) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Password not set. Please contact admin.'
                });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, freelancer.password_hash);

            if (!isValid) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid email or password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    freelancer_id: freelancer.freelancer_id,
                    email: freelancer.email,
                    name: freelancer.name,
                    role: 'freelancer'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    freelancer_id: freelancer.freelancer_id,
                    email: freelancer.email,
                    name: freelancer.name,
                    role: 'freelancer'
                }
            });
        } catch (error) {
            console.error('Freelancer login error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message || 'Login failed'
            });
        }
    }

    /**
     * Verify token (for frontend)
     */
    static async verifyToken(req, res) {
        try {
            // Token is already verified by middleware
            res.json({
                valid: true,
                user: req.user
            });
        } catch (error) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Token verification failed'
            });
        }
    }
}

module.exports = AuthController;
