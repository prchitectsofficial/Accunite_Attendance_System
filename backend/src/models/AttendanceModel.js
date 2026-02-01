const { promisePool } = require('../config/database');
const moment = require('moment');

/**
 * Attendance Model
 * Handles attendance recording with complex business rules
 */
class AttendanceModel {
    
    /**
     * Clock in for clocking employees
     * Auto-marks attendance as present
     * Checks if late based on schedule
     */
    static async clockIn(employeeCode, isOffDay = false) {
        // Get employee details
        const [employees] = await promisePool.query(
            "SELECT * FROM employees WHERE employee_code COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND status COLLATE utf8mb4_unicode_ci = 'active'",
            [employeeCode]
        );

        if (employees.length === 0) {
            throw new Error('Employee not found');
        }

        const employee = employees[0];

        if (employee.attendance_type && employee.attendance_type.toLowerCase() !== 'clocking') {
            throw new Error('This employee is not a clocking employee');
        }

        const today = moment().format('YYYY-MM-DD');
        const now = new Date();

        // Check if already clocked in today
        const [existing] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE employee_code = ? AND attendance_date = ?',
            [employeeCode, today]
        );

        if (existing.length > 0 && existing[0].clock_in_time) {
            throw new Error('Already clocked in today');
        }

        // Check if late (only for regular working days)
        let isLate = false;
        if (!isOffDay && employee.clock_start_time) {
            const scheduledStart = moment(employee.clock_start_time, 'HH:mm:ss');
            const actualStart = moment();
            const gracePeriod = employee.grace_period_minutes || 15;
            
            // Add grace period to scheduled start
            const lateThreshold = scheduledStart.add(gracePeriod, 'minutes');
            
            if (actualStart.isAfter(lateThreshold)) {
                isLate = true;
            }
        }

        // Insert or update attendance record
        if (existing.length > 0) {
            // Update existing record
            const [result] = await promisePool.query(
                `UPDATE attendance_records 
                SET clock_in_time = ?, status = 'present', is_late = ?, is_off_day_login = ?
                WHERE id = ?`,
                [now, isLate, isOffDay, existing[0].id]
            );
        } else {
            // Insert new record
            const [result] = await promisePool.query(
                `INSERT INTO attendance_records 
                (employee_code, attendance_date, status, clock_in_time, is_late, is_off_day_login)
                VALUES (?, ?, 'present', ?, ?, ?)`,
                [employeeCode, today, now, isLate, isOffDay]
            );
        }

        // Return updated record from getAllAttendanceByDate to ensure status is correct
        const allRecords = await this.getAllAttendanceByDate(today);
        const updatedRecord = allRecords.find(r => r.employee_code === employeeCode);
        return updatedRecord || this.getAttendanceByDate(employeeCode, today);
    }

    /**
     * Clock out for clocking employees
     */
    static async clockOut(employeeCode) {
        const today = moment().format('YYYY-MM-DD');
        const now = new Date();

        // Get today's attendance record
        const [records] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE employee_code = ? AND attendance_date = ?',
            [employeeCode, today]
        );

        if (records.length === 0 || !records[0].clock_in_time) {
            throw new Error('No clock-in record found for today');
        }

        if (records[0].clock_out_time) {
            throw new Error('Already clocked out today');
        }

        const record = records[0];
        const clockIn = moment(record.clock_in_time);
        const clockOut = moment(now);
        
        // Calculate total working minutes (excluding breaks)
        let totalWorkingMinutes = clockOut.diff(clockIn, 'minutes');
        
        // Subtract break time if break was taken
        let breakMinutes = 0;
        if (record.break_start_time && record.break_stop_time) {
            breakMinutes = moment(record.break_stop_time).diff(moment(record.break_start_time), 'minutes');
            // Only subtract break if it's more than 30 minutes
            if (breakMinutes > 30) {
                totalWorkingMinutes -= breakMinutes;
            }
        }
        
        // Calculate late time or overtime (570 minutes = 9.5 hours standard)
        const STANDARD_WORKING_MINUTES = 570;
        let lateMinutes = 0;
        let overtimeMinutes = 0;
        
        if (totalWorkingMinutes < STANDARD_WORKING_MINUTES) {
            lateMinutes = STANDARD_WORKING_MINUTES - totalWorkingMinutes;
        } else if (totalWorkingMinutes > STANDARD_WORKING_MINUTES) {
            overtimeMinutes = totalWorkingMinutes - STANDARD_WORKING_MINUTES;
        }

        const [result] = await promisePool.query(
            `UPDATE attendance_records 
            SET clock_out_time = ?, 
                total_working_minutes = ?,
                late_minutes = ?,
                overtime_minutes = ?
            WHERE id = ?`,
            [now, totalWorkingMinutes, lateMinutes, overtimeMinutes, record.id]
        );

        // Return updated record from getAllAttendanceByDate to ensure status is correct
        const allRecords = await this.getAllAttendanceByDate(today);
        const updatedRecord = allRecords.find(r => r.employee_code === employeeCode);
        return updatedRecord || this.getAttendanceByDate(employeeCode, today);
    }

    /**
     * Mark break start
     */
    static async breakStart(employeeCode) {
        const today = moment().format('YYYY-MM-DD');
        const now = new Date();

        // Get today's attendance record
        const [records] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE employee_code = ? AND attendance_date = ?',
            [employeeCode, today]
        );

        if (records.length === 0 || !records[0].clock_in_time) {
            throw new Error('No clock-in record found for today');
        }

        if (records[0].break_start_time && !records[0].break_stop_time) {
            throw new Error('Break already started');
        }

        const [result] = await promisePool.query(
            'UPDATE attendance_records SET break_start_time = ? WHERE id = ?',
            [now, records[0].id]
        );

        // Return updated record from getAllAttendanceByDate to ensure status is correct
        const allRecords = await this.getAllAttendanceByDate(today);
        const updatedRecord = allRecords.find(r => r.employee_code === employeeCode);
        return updatedRecord || this.getAttendanceByDate(employeeCode, today);
    }

    /**
     * Mark break stop
     */
    static async breakStop(employeeCode) {
        const today = moment().format('YYYY-MM-DD');
        const now = new Date();

        // Get today's attendance record
        const [records] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE employee_code = ? AND attendance_date = ?',
            [employeeCode, today]
        );

        if (records.length === 0 || !records[0].clock_in_time) {
            throw new Error('No clock-in record found for today');
        }

        if (!records[0].break_start_time) {
            throw new Error('No break started');
        }

        if (records[0].break_stop_time) {
            throw new Error('Break already stopped');
        }

        const [result] = await promisePool.query(
            'UPDATE attendance_records SET break_stop_time = ? WHERE id = ?',
            [now, records[0].id]
        );

        // Return updated record from getAllAttendanceByDate to ensure status is correct
        const allRecords = await this.getAllAttendanceByDate(today);
        const updatedRecord = allRecords.find(r => r.employee_code === employeeCode);
        return updatedRecord || this.getAttendanceByDate(employeeCode, today);
    }

    /**
     * Manual attendance marking for non-clocking employees
     * CRITICAL RULE: If marking absent, CL must be applied
     */
    static async markAttendance(employeeCode, date, status, notes = null) {
        // Get employee details
        const [employees] = await promisePool.query(
            "SELECT * FROM employees WHERE employee_code COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND status COLLATE utf8mb4_unicode_ci = 'active'",
            [employeeCode]
        );

        if (employees.length === 0) {
            throw new Error('Employee not found');
        }

        const employee = employees[0];

        if (employee.attendance_type && employee.attendance_type.toLowerCase() !== 'non-clocking') {
            throw new Error('Manual attendance is only for non-clocking employees');
        }

        // RULE: Absent without CL is not allowed
        if (status === 'absent') {
            throw new Error('Cannot mark absent without leave. Please use CL or PL.');
        }

        // Check if attendance already exists
        const [existing] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE employee_code = ? AND attendance_date = ?',
            [employeeCode, date]
        );

        if (existing.length > 0) {
            // Update existing
            const [result] = await promisePool.query(
                'UPDATE attendance_records SET status = ?, notes = ? WHERE id = ?',
                [status, notes, existing[0].id]
            );
            return this.getAttendanceByDate(employeeCode, date);
        } else {
            // Insert new
            const [result] = await promisePool.query(
                `INSERT INTO attendance_records 
                (employee_code, attendance_date, status, notes)
                VALUES (?, ?, ?, ?)`,
                [employeeCode, date, status, notes]
            );
            return this.getAttendanceByDate(employeeCode, date);
        }
    }

    /**
     * Mark Leave
     */
    static async markLeave(employeeCode, date, notes = null) {
        const [result] = await promisePool.query(
            `INSERT INTO attendance_records 
            (employee_code, attendance_date, status, notes)
            VALUES (?, ?, 'leave', ?)
            ON DUPLICATE KEY UPDATE status = 'leave', notes = ?`,
            [employeeCode, date, notes, notes]
        );

        return this.getAttendanceByDate(employeeCode, date);
    }

    /**
     * Get attendance record for specific date
     */
    static async getAttendanceByDate(employeeCode, date) {
        const [rows] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE employee_code = ? AND attendance_date = ?',
            [employeeCode, date]
        );
        return rows[0];
    }

    /**
     * Get attendance records for date range
     */
    static async getAttendanceRange(employeeCode, startDate, endDate) {
        const [rows] = await promisePool.query(
            `SELECT * FROM attendance_records 
            WHERE employee_code = ? 
            AND attendance_date BETWEEN ? AND ?
            ORDER BY attendance_date DESC`,
            [employeeCode, startDate, endDate]
        );
        return rows;
    }

    /**
     * Get all attendance for a specific date (all employees)
     */
    static async getAllAttendanceByDate(date) {
        // Get all active employees first
        const [allEmployees] = await promisePool.query(
            "SELECT employee_code, name, attendance_type FROM employees WHERE status COLLATE utf8mb4_unicode_ci = 'active' ORDER BY name"
        );

        // Get attendance records for the date
        const [records] = await promisePool.query(
            `SELECT ar.*, e.name as employee_name, e.attendance_type
            FROM attendance_records ar
            INNER JOIN employees e ON ar.employee_code COLLATE utf8mb4_unicode_ci = e.employee_code COLLATE utf8mb4_unicode_ci
            WHERE ar.attendance_date = ?
            AND e.status COLLATE utf8mb4_unicode_ci = 'active'`,
            [date]
        );

        // Create a map of employee_code to attendance record
        const recordMap = new Map();
        records.forEach(r => {
            recordMap.set(r.employee_code, r);
        });

        // Combine all employees with their attendance records (or null if not marked)
        const result = allEmployees.map(emp => {
            const record = recordMap.get(emp.employee_code);
            if (record) {
                return {
                    ...record,
                    employee_name: emp.name,
                    attendance_type: emp.attendance_type
                };
            } else {
                return {
                    employee_code: emp.employee_code,
                    employee_name: emp.name,
                    attendance_type: emp.attendance_type,
                    attendance_date: date,
                    status: null, // Not marked
                    clock_in_time: null,
                    clock_out_time: null
                };
            }
        });

        return result;
    }

    /**
     * Edit attendance record with audit logging
     */
    static async editAttendance(recordId, updates, adminUser, reason) {
        // Get original record
        const [original] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE id = ?',
            [recordId]
        );

        if (original.length === 0) {
            throw new Error('Attendance record not found');
        }

        const originalRecord = original[0];

        // Start transaction
        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            // Update attendance record
            const allowed = ['status', 'clock_in_time', 'clock_out_time', 'notes', 'is_late'];
            const fields = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (allowed.includes(key)) {
                    fields.push(`${key} = ?`);
                    values.push(updates[key]);

                    // Log each field change
                    if (originalRecord[key] !== updates[key]) {
                        connection.query(
                            `INSERT INTO attendance_edits 
                            (attendance_record_id, employee_code, field_name, old_value, new_value, reason, admin_user)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                recordId,
                                originalRecord.employee_code,
                                key,
                                String(originalRecord[key] || ''),
                                String(updates[key] || ''),
                                reason,
                                adminUser
                            ]
                        );
                    }
                }
            });

            if (fields.length > 0) {
                values.push(recordId);
                await connection.query(
                    `UPDATE attendance_records SET ${fields.join(', ')} WHERE id = ?`,
                    values
                );
            }

            await connection.commit();
            connection.release();

            return this.getAttendanceById(recordId);
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    }

    /**
     * Get attendance by ID
     */
    static async getAttendanceById(id) {
        const [rows] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    /**
     * Get edit history for attendance record
     */
    static async getEditHistory(recordId) {
        const [rows] = await promisePool.query(
            'SELECT * FROM attendance_edits WHERE attendance_record_id = ? ORDER BY created_at DESC',
            [recordId]
        );
        return rows;
    }

    /**
     * Check for consecutive CL
     * Returns true if CL was marked on previous day
     */
    static async hasConsecutiveCL(employeeCode, date) {
        const previousDate = moment(date).subtract(1, 'day').format('YYYY-MM-DD');
        
        const [rows] = await promisePool.query(
            'SELECT * FROM attendance_records WHERE employee_code = ? AND attendance_date = ? AND status = ?',
            [employeeCode, previousDate, 'cl']
        );

        return rows.length > 0;
    }
}

module.exports = AttendanceModel;
