const express = require('express');
const router = express.Router();
const FreelancerController = require('../controllers/FreelancerController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

/**
 * Freelancer Routes
 * Requires authentication - admin or freelancer (with restrictions)
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper middleware to check if user can access freelancer
const canAccessFreelancer = (req, res, next) => {
    const user = req.user;
    const { freelancerId } = req.params;
    
    // Admin can access any freelancer
    if (user.role === 'admin') {
        return next();
    }
    
    // Freelancer can only access their own data
    if (user.role === 'freelancer' && user.freelancer_id && parseInt(user.freelancer_id) === parseInt(freelancerId)) {
        return next();
    }
    
    // Otherwise, require admin
    if (user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied'
        });
    }
    
    next();
};

// GET /api/freelancers - Get all freelancers (admin only)
router.get('/', adminOnly, FreelancerController.getAllFreelancers);

// GET /api/freelancers/incomplete-sessions - Get incomplete sessions (admin only)
router.get('/incomplete-sessions', adminOnly, FreelancerController.getIncompleteSessions);

// GET /api/freelancers/:freelancerId - Get freelancer by ID (admin or own freelancer)
router.get('/:freelancerId', canAccessFreelancer, FreelancerController.getFreelancer);

// POST /api/freelancers - Create new freelancer (admin only)
router.post('/', adminOnly, FreelancerController.createFreelancer);

// PUT /api/freelancers/:freelancerId - Update freelancer (admin only)
router.put('/:freelancerId', adminOnly, FreelancerController.updateFreelancer);

// DELETE /api/freelancers/:freelancerId - Delete freelancer (admin only)
router.delete('/:freelancerId', adminOnly, FreelancerController.deleteFreelancer);

// POST /api/freelancers/:freelancerId/clock-in - Clock in (admin or own freelancer)
router.post('/:freelancerId/clock-in', canAccessFreelancer, FreelancerController.clockIn);

// POST /api/freelancers/:freelancerId/clock-out - Clock out (admin or own freelancer)
router.post('/:freelancerId/clock-out', canAccessFreelancer, FreelancerController.clockOut);

// GET /api/freelancers/:freelancerId/sessions - Get freelancer sessions (admin or own freelancer)
router.get('/:freelancerId/sessions', canAccessFreelancer, FreelancerController.getSessions);

// POST /api/freelancers/:freelancerId/assign-credentials - Assign email and password (Admin only)
router.post('/:freelancerId/assign-credentials', adminOnly, FreelancerController.assignCredentials);

module.exports = router;
