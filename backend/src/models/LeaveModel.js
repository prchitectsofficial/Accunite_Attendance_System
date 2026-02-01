const { promisePool } = require('../config/database');

/**
 * Leave Model
 * Handles leave ledger with transaction-based tracking
 */
class LeaveModel {
    
    /**
     * Record leave transaction
     * Updates employee balance and creates ledger entry
     */
    static async recordTransaction(employeeCode, transactionType, leaveType, amount, notes, adminUser = null, referenceDate = null) {
        // Get current balance
        const [employees] = await promisePool.query(
            "SELECT leave_balance FROM employees WHERE employee_code = ? AND status = 'active'",
            [employeeCode]
        );

        if (employees.length === 0) {
            throw new Error('Employee not found');
        }

        const employee = employees[0];
        const currentBalance = employee.leave_balance || 0;

        // Calculate new balance based on transaction type
        let newBalance = currentBalance;
        
        switch (transactionType) {
            case 'debit':
                // Using leave
                newBalance = parseFloat(currentBalance) - parseFloat(amount);
                if (newBalance < 0) {
                    throw new Error(`Insufficient ${leaveType.toUpperCase()} balance`);
                }
                break;
            
            case 'credit':
                // Adding leave
                newBalance = parseFloat(currentBalance) + parseFloat(amount);
                break;
            
            case 'encash':
                // Encashing leave (reduces balance)
                newBalance = parseFloat(currentBalance) - parseFloat(amount);
                if (newBalance < 0) {
                    throw new Error(`Insufficient ${leaveType.toUpperCase()} balance for encashment`);
                }
                break;
            
            case 'carryforward':
                // Carrying forward to next period (no balance change, just logging)
                newBalance = currentBalance;
                break;
            
            case 'conversion':
                // Conversion not applicable for single leave type
                throw new Error('Conversion not supported for leave type');
        }

        // Start transaction
        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert ledger entry
            const [ledgerResult] = await connection.query(
                `INSERT INTO leave_ledger 
                (employee_code, transaction_type, leave_type, amount, balance_after, notes, admin_user, reference_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [employeeCode, transactionType, leaveType, amount, newBalance, notes, adminUser, referenceDate]
            );

            // Update employee balance
            await connection.query(
                `UPDATE employees SET leave_balance = ? WHERE employee_code = ?`,
                [newBalance, employeeCode]
            );

            await connection.commit();
            connection.release();

            return {
                transaction_id: ledgerResult.insertId,
                new_balance: newBalance
            };
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    }

    /**
     * Get leave ledger for an employee
     */
    static async getLedger(employeeCode, startDate = null, endDate = null) {
        let query = 'SELECT * FROM leave_ledger WHERE employee_code = ?';
        const params = [employeeCode];

        if (startDate) {
            query += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND created_at <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await promisePool.query(query, params);
        return rows;
    }

    /**
     * Get current balances for employee
     */
    static async getBalances(employeeCode) {
        const [rows] = await promisePool.query(
            "SELECT leave_balance, leave_allotted FROM employees WHERE employee_code = ? AND status = 'active'",
            [employeeCode]
        );
        
        if (rows.length === 0) {
            throw new Error('Employee not found');
        }

        return {
            leave_balance: rows[0].leave_balance || 0,
            leave_allotted: rows[0].leave_allotted || 0
        };
    }


    /**
     * Credit leave (add to balance)
     */
    static async creditLeave(employeeCode, leaveType, amount, notes, adminUser) {
        return this.recordTransaction(
            employeeCode,
            'credit',
            leaveType,
            amount,
            notes,
            adminUser,
            null
        );
    }

    /**
     * Debit leave (use leave)
     */
    static async debitLeave(employeeCode, leaveType, amount, referenceDate, notes = '') {
        return this.recordTransaction(
            employeeCode,
            'debit',
            leaveType,
            amount,
            notes || `Leave applied for ${referenceDate}`,
            'SYSTEM',
            referenceDate
        );
    }

    /**
     * Get leave summary for reporting
     */
    static async getLeaveSummary(employeeCode, startDate, endDate) {
        const [rows] = await promisePool.query(
            `SELECT 
                leave_type,
                transaction_type,
                SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as total_used,
                SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_added,
                SUM(CASE WHEN transaction_type = 'encash' THEN amount ELSE 0 END) as total_encashed
            FROM leave_ledger
            WHERE employee_code = ?
            AND created_at BETWEEN ? AND ?
            GROUP BY leave_type, transaction_type`,
            [employeeCode, startDate, endDate]
        );

        return rows;
    }
}

module.exports = LeaveModel;
