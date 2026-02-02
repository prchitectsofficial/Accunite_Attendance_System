const express = require('express');
const router = express.Router();
const YearlyLeaveController = require('../controllers/YearlyLeaveController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

/**
 * Yearly Leave Routes
 * Admin only - for managing yearly leave allocation
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/yearly-leaves/allocate - Allocate yearly leaves to all employees (Admin only)
router.post('/allocate', adminOnly, YearlyLeaveController.allocateYearlyLeaves);

// GET /api/yearly-leaves/status - Check yearly allocation status (Admin only)
router.get('/status', adminOnly, YearlyLeaveController.checkAllocationStatus);

module.exports = router;
