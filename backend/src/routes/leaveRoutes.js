const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/LeaveController');
const { authMiddleware, adminOnly, employeeOrAdmin } = require('../middleware/authMiddleware');

/**
 * Leave Routes
 * Requires authentication - admin or employee (with restrictions)
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/leaves/apply - Apply leave (single day) - employees can apply for themselves
router.post('/apply', employeeOrAdmin, LeaveController.applyLeave);

// POST /api/leaves/apply-multiple - Apply multiple days of leave - employees can apply for themselves
router.post('/apply-multiple', employeeOrAdmin, LeaveController.applyMultipleDays);

// POST /api/leaves/redeem-cl - Redeem CL manually - admin only
router.post('/redeem-cl', adminOnly, LeaveController.redeemCL);

// POST /api/leaves/encash-cl - Encash CL - employees can encash for themselves
router.post('/encash-cl', employeeOrAdmin, LeaveController.encashCL);

// POST /api/leaves/carryforward-cl - Carry forward CL - admin only
router.post('/carryforward-cl', adminOnly, LeaveController.carryForwardCL);

// POST /api/leaves/credit - Credit leave (add to balance) - admin only
router.post('/credit', adminOnly, LeaveController.creditLeave);

// GET /api/leaves/:employeeCode/history - Get leave history - employees can view their own
router.get('/:employeeCode/history', employeeOrAdmin, LeaveController.getLeaveHistory);

// GET /api/leaves/:employeeCode/balances - Get current balances - employees can view their own
router.get('/:employeeCode/balances', employeeOrAdmin, LeaveController.getBalances);

// GET /api/leaves/:employeeCode/summary - Get leave summary for period - employees can view their own
router.get('/:employeeCode/summary', employeeOrAdmin, LeaveController.getLeaveSummary);

module.exports = router;
