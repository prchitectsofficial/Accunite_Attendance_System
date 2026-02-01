const LeaveService = require('../services/LeaveService');

/**
 * Leave Controller
 * Handles leave application and management with business rules
 */
class LeaveController {
    
    /**
     * Apply leave (single day)
     * Handles consecutive CL conversion automatically
     */
    static async applyLeave(req, res) {
        try {
            const { employee_code, date, leave_type, notes, reason } = req.body;
            const user = req.user;

            if (!employee_code || !date || !leave_type) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code, date, and leave type are required'
                });
            }

            if (!['cl', 'pl'].includes(leave_type)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Leave type must be "cl" or "pl"'
                });
            }

            // Permission check: Employee can only apply leave for themselves
            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only apply leave for yourself'
                });
            }

            // Combine notes and reason
            const combinedNotes = reason ? (notes ? `${notes}. Reason: ${reason}` : `Reason: ${reason}`) : notes;

            const adminUser = user.role === 'admin' ? user.username : null;
            const result = await LeaveService.applyLeave(
                employee_code,
                date,
                leave_type,
                combinedNotes,
                adminUser
            );

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Apply leave error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Apply multiple days of leave
     * Employees can apply for themselves, admins can apply for anyone
     */
    static async applyMultipleDays(req, res) {
        try {
            const { employee_code, start_date, end_date, leave_type, notes, reason } = req.body;
            const user = req.user;

            // Permission check: Employee can only apply leave for themselves
            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only apply leave for yourself'
                });
            }

            // Combine notes and reason
            const combinedNotes = reason ? (notes ? `${notes}. Reason: ${reason}` : `Reason: ${reason}`) : notes;

            if (!employee_code || !start_date || !end_date || !leave_type) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code, start date, end date, and leave type are required'
                });
            }

            const adminUser = req.user.username;
            const results = await LeaveService.applyMultipleDays(
                employee_code,
                start_date,
                end_date,
                leave_type,
                notes,
                adminUser
            );

            res.json({
                success: true,
                message: 'Leave application processed',
                results
            });
        } catch (error) {
            console.error('Apply multiple days error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Redeem CL manually
     */
    static async redeemCL(req, res) {
        try {
            const { employee_code, amount, notes } = req.body;

            if (!employee_code || !amount || !notes) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code, amount, and notes are required'
                });
            }

            const adminUser = req.user.username;
            const result = await LeaveService.redeemCL(
                employee_code,
                amount,
                notes,
                adminUser
            );

            res.json({
                success: true,
                message: 'CL redeemed successfully',
                data: result
            });
        } catch (error) {
            console.error('Redeem CL error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Encash CL
     */
    static async encashCL(req, res) {
        try {
            const { employee_code, amount, notes } = req.body;
            const user = req.user;

            if (!employee_code || !amount || !notes) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code, amount, and notes are required'
                });
            }

            // Permission check: Employee can only encash for themselves
            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only encash leave for yourself'
                });
            }

            const adminUser = user.role === 'admin' ? user.username : null;
            const result = await LeaveService.encashCL(
                employee_code,
                amount,
                notes,
                adminUser
            );

            res.json({
                success: true,
                message: 'CL encashed successfully',
                data: result
            });
        } catch (error) {
            console.error('Encash CL error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Carry forward CL
     */
    static async carryForwardCL(req, res) {
        try {
            const { employee_code, notes } = req.body;

            if (!employee_code || !notes) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code and notes are required'
                });
            }

            const adminUser = req.user.username;
            const result = await LeaveService.carryForwardCL(
                employee_code,
                notes,
                adminUser
            );

            res.json({
                success: true,
                message: 'CL carried forward successfully',
                data: result
            });
        } catch (error) {
            console.error('Carry forward CL error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Credit leave (add to balance)
     */
    static async creditLeave(req, res) {
        try {
            const { employee_code, leave_type, amount, notes } = req.body;

            if (!employee_code || !leave_type || !amount || !notes) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code, leave type, amount, and notes are required'
                });
            }

            const adminUser = req.user.username;
            const result = await LeaveService.creditLeave(
                employee_code,
                leave_type,
                amount,
                notes,
                adminUser
            );

            res.json({
                success: true,
                message: 'Leave credited successfully',
                data: result
            });
        } catch (error) {
            console.error('Credit leave error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Get leave history
     */
    static async getLeaveHistory(req, res) {
        try {
            const { employeeCode } = req.params;
            const { start_date, end_date } = req.query;
            const user = req.user;

            // Permission check: Employee can only view their own history
            if (user.role === 'employee' && user.employee_code !== employeeCode) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only view your own leave history'
                });
            }

            const history = await LeaveService.getLeaveHistory(
                employeeCode,
                start_date,
                end_date
            );

            res.json({
                success: true,
                count: history.length,
                data: history
            });
        } catch (error) {
            console.error('Get leave history error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get current balances
     */
    static async getBalances(req, res) {
        try {
            const { employeeCode } = req.params;
            const user = req.user;

            // Permission check: Employee can only view their own balances
            if (user.role === 'employee' && user.employee_code !== employeeCode) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only view your own leave balances'
                });
            }

            const balances = await LeaveService.getBalances(employeeCode);

            res.json({
                success: true,
                data: balances
            });
        } catch (error) {
            console.error('Get balances error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get leave summary for period
     */
    static async getLeaveSummary(req, res) {
        try {
            const { employeeCode } = req.params;
            const { start_date, end_date } = req.query;
            const user = req.user;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Start date and end date are required'
                });
            }

            // Permission check: Employee can only view their own summary
            if (user.role === 'employee' && user.employee_code !== employeeCode) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only view your own leave summary'
                });
            }

            const summary = await LeaveService.getLeaveSummary(
                employeeCode,
                start_date,
                end_date
            );

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Get leave summary error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
}

module.exports = LeaveController;
