const AttendanceModel = require('../models/AttendanceModel');

/**
 * Attendance Controller
 * Handles attendance operations for clocking and non-clocking employees
 */
class AttendanceController {
    
    /**
     * Clock in (for clocking employees)
     * Employees can only clock themselves in, admins can clock anyone
     */
    static async clockIn(req, res) {
        try {
            const { employee_code } = req.body;
            const { is_off_day } = req.query;
            const user = req.user; // From auth middleware

            if (!employee_code) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code is required'
                });
            }

            // Permission check: Employee can only clock themselves, admin can clock anyone
            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only clock in yourself'
                });
            }

            const attendance = await AttendanceModel.clockIn(
                employee_code,
                is_off_day === 'true'
            );

            res.json({
                success: true,
                message: is_off_day === 'true' 
                    ? 'Clocked in successfully on off day'
                    : 'Clocked in successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Clock in error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Clock out (for clocking employees)
     * Employees can only clock themselves out, admins can clock anyone
     */
    static async clockOut(req, res) {
        try {
            const { employee_code, work_summary } = req.body;
            const user = req.user; // From auth middleware

            if (!employee_code) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code is required'
                });
            }

            // Permission check: Employee can only clock themselves, admin can clock anyone
            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only clock out yourself'
                });
            }

            const attendance = await AttendanceModel.clockOut(employee_code, work_summary);

            res.json({
                success: true,
                message: 'Clocked out successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Clock out error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Break start (for clocking employees)
     */
    static async breakStart(req, res) {
        try {
            const { employee_code } = req.body;
            const user = req.user;

            if (!employee_code) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code is required'
                });
            }

            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only mark break for yourself'
                });
            }

            const attendance = await AttendanceModel.breakStart(employee_code);

            res.json({
                success: true,
                message: 'Break started successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Break start error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Break stop (for clocking employees)
     */
    static async breakStop(req, res) {
        try {
            const { employee_code } = req.body;
            const user = req.user;

            if (!employee_code) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code is required'
                });
            }

            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only mark break for yourself'
                });
            }

            const attendance = await AttendanceModel.breakStop(employee_code);

            res.json({
                success: true,
                message: 'Break stopped successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Break stop error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Manual attendance marking (for non-clocking employees)
     * Employees can only mark their own attendance, admins can mark for anyone
     */
    static async markAttendance(req, res) {
        try {
            const { employee_code, date, status, notes } = req.body;
            const user = req.user; // From auth middleware

            if (!employee_code || !date || !status) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Employee code, date, and status are required'
                });
            }

            // Permission check: Employee can only mark their own attendance, admin can mark for anyone
            if (user.role === 'employee' && user.employee_code !== employee_code) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only mark attendance for yourself'
                });
            }

            const attendance = await AttendanceModel.markAttendance(
                employee_code,
                date,
                status,
                notes
            );

            res.json({
                success: true,
                message: 'Attendance marked successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Mark attendance error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Get attendance for specific date
     */
    static async getAttendanceByDate(req, res) {
        try {
            const { employeeCode, date } = req.params;

            const attendance = await AttendanceModel.getAttendanceByDate(employeeCode, date);

            if (!attendance) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'No attendance record found for this date'
                });
            }

            res.json({
                success: true,
                data: attendance
            });
        } catch (error) {
            console.error('Get attendance error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get attendance records for date range
     */
    static async getAttendanceRange(req, res) {
        try {
            const { employeeCode } = req.params;
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Start date and end date are required'
                });
            }

            const records = await AttendanceModel.getAttendanceRange(
                employeeCode,
                start_date,
                end_date
            );

            res.json({
                success: true,
                count: records.length,
                data: records
            });
        } catch (error) {
            console.error('Get attendance range error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get all attendance for a specific date
     */
    static async getAllAttendanceByDate(req, res) {
        try {
            const { date } = req.params;

            const records = await AttendanceModel.getAllAttendanceByDate(date);

            res.json({
                success: true,
                count: records.length,
                data: records
            });
        } catch (error) {
            console.error('Get all attendance error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Edit attendance record
     */
    static async editAttendance(req, res) {
        try {
            const { recordId } = req.params;
            const { updates, reason } = req.body;

            if (!updates || !reason) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Updates and reason are required'
                });
            }

            const adminUser = req.user.username; // From JWT token

            const attendance = await AttendanceModel.editAttendance(
                recordId,
                updates,
                adminUser,
                reason
            );

            res.json({
                success: true,
                message: 'Attendance edited successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Edit attendance error:', error);
            res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
    }

    /**
     * Get edit history for attendance record
     */
    static async getEditHistory(req, res) {
        try {
            const { recordId } = req.params;

            const history = await AttendanceModel.getEditHistory(recordId);

            res.json({
                success: true,
                count: history.length,
                data: history
            });
        } catch (error) {
            console.error('Get edit history error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
}

module.exports = AttendanceController;
