const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and protect routes
 * Supports both admin and employee tokens
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'No token provided' 
            });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Determine role
        if (decoded.admin_id) {
            decoded.role = 'admin';
        } else if (decoded.employee_code) {
            decoded.role = 'employee';
        } else if (decoded.freelancer_id) {
            decoded.role = 'freelancer';
        }
        
        // Attach user info to request object
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Token expired' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Invalid token' 
            });
        }

        return res.status(500).json({ 
            error: 'Internal Server Error',
            message: 'Token verification failed' 
        });
    }
};

/**
 * Middleware to check if user is admin
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }
};

/**
 * Middleware to check if user is employee or admin
 */
const employeeOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'employee')) {
        next();
    } else {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Authentication required'
        });
    }
};

module.exports = { authMiddleware, adminOnly, employeeOrAdmin };
