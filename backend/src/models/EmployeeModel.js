const { promisePool } = require('../config/database');

/**
 * Employee Model
 * Handles all database operations for employees
 */
class EmployeeModel {
    
    /**
     * Get all active employees
     */
    static async getAll() {
        const [rows] = await promisePool.query(
            "SELECT * FROM employees WHERE status COLLATE utf8mb4_unicode_ci = 'active' ORDER BY employee_code"
        );
        return rows;
    }

    /**
     * Get employee by code
     */
    static async getByCode(employeeCode) {
        const [rows] = await promisePool.query(
            "SELECT * FROM employees WHERE employee_code COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND status COLLATE utf8mb4_unicode_ci = 'active'",
            [employeeCode]
        );
        return rows[0];
    }

    /**
     * Create new employee
     */
    static async create(employeeData) {
        const {
            employee_code,
            name,
            designation,
            email,
            salary,
            attendance_type,
            leave_balance,
            leave_allotted,
            date_of_joining,
            bank_name,
            ifsc,
            bank_account_number,
            aadhaar_number,
            pan
        } = employeeData;

        // Build dynamic query for optional fields
        const fields = ['employee_code', 'name', 'designation', 'email', 'salary', 'attendance_type', 'leave_balance', 'leave_allotted', 'status'];
        const values = [
            employee_code,
            name,
            designation || null,
            email || null,
            salary || null,
            attendance_type || 'clocking',
            leave_balance || 0,
            leave_allotted || 0,
            'active'
        ];

        // Add optional fields if they exist
        if (date_of_joining !== undefined) {
            fields.push('date_of_joining');
            values.push(date_of_joining || null);
        }
        if (bank_name !== undefined) {
            fields.push('bank_name');
            values.push(bank_name || null);
        }
        if (ifsc !== undefined) {
            fields.push('ifsc');
            values.push(ifsc || null);
        }
        if (bank_account_number !== undefined) {
            fields.push('bank_account_number');
            values.push(bank_account_number || null);
        }
        if (aadhaar_number !== undefined) {
            fields.push('aadhaar_number');
            values.push(aadhaar_number || null);
        }
        if (pan !== undefined) {
            fields.push('pan');
            values.push(pan || null);
        }

        const placeholders = fields.map(() => '?').join(', ');
        const [result] = await promisePool.query(
            `INSERT INTO employees (${fields.join(', ')}) VALUES (${placeholders})`,
            values
        );

        return this.getByCode(employee_code);
    }

    /**
     * Update employee details
     */
    static async update(employeeCode, updateData) {
        const allowed = [
            'name', 'designation', 'email', 'password_hash', 'password_plain', 'salary', 'attendance_type', 'clock_start_time', 'clock_end_time', 'grace_period_minutes',
            'leave_balance', 'leave_allotted', 'status', 'date_of_joining', 'bank_name', 'ifsc', 'bank_account_number', 'aadhaar_number', 'pan'
        ];

        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (allowed.includes(key) && updateData[key] !== undefined && updateData[key] !== null) {
                if (key === 'attendance_type' && updateData[key]) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key].toLowerCase());
                } else if (key === 'status' && updateData[key]) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key].toLowerCase());
                } else {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            }
        });

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(employeeCode);

        const [result] = await promisePool.query(
            `UPDATE employees SET ${fields.join(', ')} WHERE employee_code = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error('Employee not found');
        }

        return this.getByCode(employeeCode);
    }

    /**
     * Soft delete employee
     */
    static async delete(employeeCode) {
        const [result] = await promisePool.query(
            "UPDATE employees SET status = 'inactive' WHERE employee_code = ?",
            [employeeCode]
        );

        return result.affectedRows > 0;
    }

    /**
     * Update leave balance after transaction
     */
    static async updateLeaveBalance(employeeCode, leaveType, newBalance) {
        if (newBalance < 0) {
            throw new Error('Leave balance cannot be negative');
        }

        const [result] = await promisePool.query(
            `UPDATE employees SET leave_balance = ? WHERE employee_code = ? AND status = 'active'`,
            [newBalance, employeeCode]
        );

        if (result.affectedRows === 0) {
            throw new Error('Employee not found');
        }

        return true;
    }

    /**
     * Get employees by attendance type
     */
    static async getByAttendanceType(attendanceType) {
        const type = attendanceType.toLowerCase();
        const [rows] = await promisePool.query(
            "SELECT * FROM employees WHERE attendance_type = ? AND status = 'active'",
            [type]
        );
        return rows;
    }
}

module.exports = EmployeeModel;