const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/AttendanceController');
const { authMiddleware, employeeOrAdmin } = require('../middleware/authMiddleware');

/**
 * Attendance Routes
 * Requires authentication (admin or employee)
 */

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(employeeOrAdmin);

// POST /api/attendance/clock-in - Clock in for clocking employees
router.post('/clock-in', AttendanceController.clockIn);

// POST /api/attendance/clock-out - Clock out for clocking employees
router.post('/clock-out', AttendanceController.clockOut);

// POST /api/attendance/break-start - Start break
router.post('/break-start', AttendanceController.breakStart);

// POST /api/attendance/break-stop - Stop break
router.post('/break-stop', AttendanceController.breakStop);

// POST /api/attendance/mark - Manual attendance marking for non-clocking employees
router.post('/mark', AttendanceController.markAttendance);

// GET /api/attendance/date/:date - Get all attendance for a specific date
router.get('/date/:date', AttendanceController.getAllAttendanceByDate);

// GET /api/attendance/:employeeCode/:date - Get attendance for employee on specific date
router.get('/:employeeCode/:date', AttendanceController.getAttendanceByDate);

// GET /api/attendance/:employeeCode/range - Get attendance range
router.get('/:employeeCode/range', AttendanceController.getAttendanceRange);

// PUT /api/attendance/:recordId - Edit attendance record
router.put('/:recordId', AttendanceController.editAttendance);

// GET /api/attendance/:recordId/history - Get edit history
router.get('/:recordId/history', AttendanceController.getEditHistory);

module.exports = router;
