const EmployeeModel = require('../models/EmployeeModel');
const SalarySlipService = require('../services/SalarySlipService');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

/**
 * Employee Controller
 * Handles employee management operations
 */
class EmployeeController {
    
    /**
     * Get all employees
     */
    static async getAllEmployees(req, res) {
        try {
            const employees = await EmployeeModel.getAll();
            res.json({
                success: true,
                count: employees.length,
                data: employees
            });
        } catch (error) {
            console.error('Get employees error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get employee by code
     */
    static async getEmployee(req, res) {
        try {
            const { employeeCode } = req.params;
            const employee = await EmployeeModel.getByCode(employeeCode);
            
            if (!employee) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Employee not found'
                });
            }

            res.json({
                success: true,
                data: employee
            });
        } catch (error) {
            console.error('Get employee error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Create new employee
     */
    static async createEmployee(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation Error',
                    details: errors.array()
                });
            }

            const employeeData = req.body;
            const employee = await EmployeeModel.create(employeeData);

            res.status(201).json({
                success: true,
                message: 'Employee created successfully',
                data: employee
            });
        } catch (error) {
            console.error('Create employee error:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Employee code already exists'
                });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Update employee
     */
    static async updateEmployee(req, res) {
        try {
            const { employeeCode } = req.params;
            const updateData = req.body;

            const employee = await EmployeeModel.update(employeeCode, updateData);

            res.json({
                success: true,
                message: 'Employee updated successfully',
                data: employee
            });
        } catch (error) {
            console.error('Update employee error:', error);
            
            if (error.message === 'Employee not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: error.message
                });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Delete employee (soft delete)
     */
    static async deleteEmployee(req, res) {
        try {
            const { employeeCode } = req.params;
            const deleted = await EmployeeModel.delete(employeeCode);

            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Employee not found'
                });
            }

            res.json({
                success: true,
                message: 'Employee deleted successfully'
            });
        } catch (error) {
            console.error('Delete employee error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get employees by attendance type
     */
    static async getByAttendanceType(req, res) {
        try {
            const { type } = req.params;
            
            if (!['clocking', 'non-clocking'].includes(type)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid attendance type. Must be "clocking" or "non-clocking"'
                });
            }

            const employees = await EmployeeModel.getByAttendanceType(type);
            
            res.json({
                success: true,
                count: employees.length,
                data: employees
            });
        } catch (error) {
            console.error('Get by attendance type error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Assign credentials to employee (Admin only)
     */
    static async assignCredentials(req, res) {
        try {
            const { employeeCode } = req.params;
            const { email, password } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Email is required'
                });
            }

            // Check if employee exists and has credentials
            const existingEmployee = await EmployeeModel.getByCode(employeeCode);
            if (!existingEmployee) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Employee not found'
                });
            }

            // If password is provided, hash it and store plain text for admin viewing
            const updateData = {
                email
            };

            if (password) {
                // Hash new password for security
                updateData.password_hash = await bcrypt.hash(password, 10);
                // Store plain text for admin viewing (as per requirement)
                updateData.password_plain = password;
            } else if (!existingEmployee.password_hash) {
                // Password required for new credentials
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Password is required for new credentials'
                });
            }
            // If password not provided but employee has existing password, don't update password_hash or password_plain

            const employee = await EmployeeModel.update(employeeCode, updateData);

            res.json({
                success: true,
                message: 'Credentials assigned successfully',
                data: {
                    employee_code: employee.employee_code,
                    name: employee.name,
                    email: employee.email
                }
            });
        } catch (error) {
            console.error('Assign credentials error:', error);
            
            if (error.message === 'Employee not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: error.message
                });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get salary slip for an employee
     * Employees can only view their own salary slip, admins can view any
     */
    static async getSalarySlip(req, res) {
        try {
            const { employeeCode } = req.params;
            const { year, month } = req.query;

            // Validate year and month
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);

            if (!yearNum || yearNum < 2000 || yearNum > 2100) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid year'
                });
            }

            if (!monthNum || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid month'
                });
            }

            // Check if user can access this employee's salary slip
            const user = req.user;
            const isAdmin = user.role === 'admin' || user.admin_id;
            const isOwnEmployee = user.employee_code === employeeCode;

            if (!isAdmin && !isOwnEmployee) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only view your own salary slip'
                });
            }

            // Generate salary slip
            const salarySlip = await SalarySlipService.generateSalarySlip(employeeCode, yearNum, monthNum);

            res.json({
                success: true,
                data: salarySlip
            });
        } catch (error) {
            console.error('Get salary slip error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
}

module.exports = EmployeeController;
