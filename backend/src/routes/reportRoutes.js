const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const { authMiddleware, employeeOrAdmin } = require('../middleware/authMiddleware');

/**
 * Report Routes
 * Requires authentication - employees can view, admin can do everything
 */

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(employeeOrAdmin);

// GET /api/reports/employees - Get all employees summary
router.get('/employees', ReportController.getAllEmployeesSummary);

// GET /api/reports/employees/:employeeCode - Get employee summary
router.get('/employees/:employeeCode', ReportController.getEmployeeSummary);

// GET /api/reports/daily/:date - Get daily attendance report
router.get('/daily/:date', ReportController.getDailyAttendanceReport);

// GET /api/reports/freelancers/:freelancerId - Get freelancer summary
router.get('/freelancers/:freelancerId', ReportController.getFreelancerSummary);

// GET /api/reports/incomplete-sessions - Get incomplete sessions report
router.get('/incomplete-sessions', ReportController.getIncompleteSessionsReport);

// GET /api/reports/late-arrivals - Get late arrivals report
router.get('/late-arrivals', ReportController.getLateArrivalsReport);

// GET /api/reports/leave-usage - Get leave usage report
router.get('/leave-usage', ReportController.getLeaveUsageReport);

module.exports = router;
