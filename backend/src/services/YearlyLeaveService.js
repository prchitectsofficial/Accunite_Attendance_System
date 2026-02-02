const { promisePool } = require('../config/database');
const moment = require('moment');
const EmployeeModel = require('../models/EmployeeModel');
const LeaveModel = require('../models/LeaveModel');

/**
 * Yearly Leave Service
 * Handles yearly leave allocation and carry forward
 */
class YearlyLeaveService {
    
    /**
     * Allocate yearly leaves to all employees
     * This should be called at the start of each year (January)
     * - Adds 15 new leaves to each employee
     * - Carries forward previous year's remaining leaves
     */
    static async allocateYearlyLeaves(year = null) {
        if (!year) {
            year = moment().year();
        }

        // Get all active employees
        const employees = await EmployeeModel.getAll();
        
        const results = [];
        
        for (const employee of employees) {
            try {
                // Get current leave balance (this will be carried forward)
                const currentBalance = parseFloat(employee.leave_balance) || 0;
                const currentAllotted = parseFloat(employee.leave_allotted) || 0;
                
                // New leaves for this year
                const newLeaves = 15;
                
                // Record carry forward first (if any)
                if (currentBalance > 0) {
                    await LeaveModel.recordTransaction(
                        employee.employee_code,
                        'carryforward',
                        'pl',
                        currentBalance,
                        `Carry forward from previous year (${year - 1}). Balance: ${currentBalance}`,
                        'system',
                        null
                    );
                }
                
                // Add new yearly leaves
                await LeaveModel.recordTransaction(
                    employee.employee_code,
                    'credit',
                    'pl',
                    newLeaves,
                    `Yearly leave allocation for ${year}. Added ${newLeaves} leaves. Previous balance: ${currentBalance}, Carry forward: ${currentBalance}`,
                    'system',
                    null
                );
                
                // Update leave_allotted
                const totalAllotted = currentAllotted + newLeaves;
                await promisePool.query(
                    `UPDATE employees 
                    SET leave_allotted = ?,
                        updated_at = NOW()
                    WHERE employee_code = ? AND status = 'active'`,
                    [totalAllotted, employee.employee_code]
                );
                
                // Get final balance after transactions
                const finalBalance = await LeaveModel.getBalances(employee.employee_code);
                const totalLeaves = finalBalance.leave_balance;
                
                results.push({
                    employee_code: employee.employee_code,
                    name: employee.name,
                    previous_balance: currentBalance,
                    new_leaves: newLeaves,
                    carry_forward: currentBalance > 0 ? currentBalance : 0,
                    total_balance: totalLeaves,
                    success: true
                });
            } catch (error) {
                console.error(`Error allocating leaves for ${employee.employee_code}:`, error);
                results.push({
                    employee_code: employee.employee_code,
                    name: employee.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return {
            year,
            total_employees: employees.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }
    
    /**
     * Check if yearly allocation has been done for current year
     */
    static async checkYearlyAllocation(year = null) {
        if (!year) {
            year = moment().year();
        }
        
        const startOfYear = `${year}-01-01`;
        const endOfYear = `${year}-01-31`; // Check in January
        
        const [records] = await promisePool.query(
            `SELECT COUNT(DISTINCT employee_code) as allocated_count
            FROM leave_ledger
            WHERE transaction_type = 'credit'
            AND notes LIKE ?
            AND created_at >= ? AND created_at <= ?`,
            [`%Yearly leave allocation for ${year}%`, startOfYear, endOfYear]
        );
        
        const [totalEmployees] = await promisePool.query(
            `SELECT COUNT(*) as total FROM employees WHERE status = 'active'`
        );
        
        return {
            year,
            allocated: records[0].allocated_count,
            total_employees: totalEmployees[0].total,
            is_allocated: records[0].allocated_count > 0
        };
    }
}

module.exports = YearlyLeaveService;
