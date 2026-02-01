const LeaveModel = require('../models/LeaveModel');
const AttendanceModel = require('../models/AttendanceModel');

/**
 * Leave Service
 * Contains complex business logic for leave management
 * Handles consecutive CL rule and leave application
 */
class LeaveService {
    
    /**
     * Apply leave with validation
     */
    static async applyLeave(employeeCode, date, leaveType, notes = null, adminUser = null) {
        // Check if employee has sufficient balance
        const balances = await LeaveModel.getBalances(employeeCode);
        const requiredBalance = balances.leave_balance;
        
        if (requiredBalance < 1) {
            throw new Error(`Insufficient leave balance. Available: ${requiredBalance}`);
        }

        // Debit the leave
        await LeaveModel.debitLeave(
            employeeCode,
            'leave',
            1, // 1 day
            date,
            notes || ''
        );

        // Mark attendance with leave status
        await AttendanceModel.markLeave(employeeCode, date, notes || '');

        return {
            applied_leave_type: 'leave',
            was_converted: false,
            original_leave_type: leaveType,
            message: 'Leave applied successfully.'
        };
    }

    /**
     * Apply multiple days of leave
     */
    static async applyMultipleDays(employeeCode, startDate, endDate, leaveType, notes = null, adminUser = null) {
        const moment = require('moment');
        const results = [];
        
        let currentDate = moment(startDate);
        const end = moment(endDate);

        while (currentDate.isSameOrBefore(end)) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            
            try {
                const result = await this.applyLeave(employeeCode, dateStr, leaveType, notes, adminUser);
                results.push({
                    date: dateStr,
                    success: true,
                    ...result
                });
            } catch (error) {
                results.push({
                    date: dateStr,
                    success: false,
                    error: error.message
                });
            }

            currentDate.add(1, 'day');
        }

        return results;
    }


    /**
     * Credit leave (add to balance)
     */
    static async creditLeave(employeeCode, leaveType, amount, notes, adminUser) {
        return LeaveModel.creditLeave(employeeCode, leaveType, amount, notes, adminUser);
    }

    /**
     * Get leave history with ledger
     */
    static async getLeaveHistory(employeeCode, startDate = null, endDate = null) {
        return LeaveModel.getLedger(employeeCode, startDate, endDate);
    }

    /**
     * Get current balances
     */
    static async getBalances(employeeCode) {
        return LeaveModel.getBalances(employeeCode);
    }

    /**
     * Get leave summary for period
     */
    static async getLeaveSummary(employeeCode, startDate, endDate) {
        const ledgerSummary = await LeaveModel.getLeaveSummary(employeeCode, startDate, endDate);
        const currentBalances = await LeaveModel.getBalances(employeeCode);

        return {
            current_balances: currentBalances,
            period_summary: ledgerSummary
        };
    }
}

module.exports = LeaveService;
