const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/EmployeeController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

/**
 * Employee Routes
 * Requires authentication - admin only for create/update/delete
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/employees - Get all employees (admin and employees can view)
router.get('/', EmployeeController.getAllEmployees);

// GET /api/employees/type/:type - Get employees by attendance type
router.get('/type/:type', EmployeeController.getByAttendanceType);

// GET /api/employees/:employeeCode - Get employee by code
router.get('/:employeeCode', EmployeeController.getEmployee);

// POST /api/employees - Create new employee (Admin only)
router.post(
    '/',
    adminOnly,
    [
        body('employee_code').notEmpty().withMessage('Employee code is required'),
        body('name').notEmpty().withMessage('Name is required'),
        body('attendance_type')
            .isIn(['clocking', 'non-clocking'])
            .withMessage('Attendance type must be "clocking" or "non-clocking"'),
    ],
    EmployeeController.createEmployee
);

// PUT /api/employees/:employeeCode - Update employee (Admin only)
router.put('/:employeeCode', adminOnly, EmployeeController.updateEmployee);

// DELETE /api/employees/:employeeCode - Delete employee (Admin only)
router.delete('/:employeeCode', adminOnly, EmployeeController.deleteEmployee);

// POST /api/employees/:employeeCode/assign-credentials - Assign email and password (Admin only)
router.post('/:employeeCode/assign-credentials', authMiddleware, adminOnly, EmployeeController.assignCredentials);

// GET /api/employees/:employeeCode/salary-slip - Get salary slip (Employee can view own, Admin can view any)
router.get('/:employeeCode/salary-slip', EmployeeController.getSalarySlip);

module.exports = router;
