const { promisePool } = require('../config/database');
const moment = require('moment');
const EmployeeModel = require('../models/EmployeeModel');
const AttendanceModel = require('../models/AttendanceModel');

/**
 * Salary Slip Service
 * Calculates salary components based on attendance and leave records
 */
class SalarySlipService {
    
    /**
     * Generate salary slip for an employee for a specific month
     */
    static async generateSalarySlip(employeeCode, year, month) {
        // Get employee details
        const employee = await EmployeeModel.getByCode(employeeCode);
        if (!employee) {
            throw new Error('Employee not found');
        }

        // Calculate date range for the month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // Get attendance records for the month
        const attendanceRecords = await this.getAttendanceForMonth(employeeCode, startDate, endDate);
        
        // Get leave usage for the month
        const leaveUsage = await this.getLeaveUsageForMonth(employeeCode, startDate, endDate);

        // Calculate working days (excluding weekends for attendance calculation)
        const totalDays = lastDay;
        const workingDays = this.calculateWorkingDays(startDate, endDate);
        const weekOffs = totalDays - workingDays; // Saturday and Sunday count
        
        // Count present days and leave days from attendance records
        const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        const leaveDays = leaveUsage.leave_days || 0;
        
        // Calculate unpaid leave days: working days where employee was neither present nor on paid leave
        // This includes:
        // 1. Explicitly marked 'absent' days (not counted in presentDays)
        // 2. Working days with no attendance record (not present, not on paid leave)
        // Formula: total working days - present days - paid leave days = unpaid leave days
        let unpaidLeaveDays = workingDays - presentDays - leaveDays;
        if (unpaidLeaveDays < 0) unpaidLeaveDays = 0;

        // Get employee salary (base salary)
        const baseSalary = parseFloat(employee.salary) || 0;

        // Calculate salary components:
        // Basic: 50% of salary
        // Conveyance: ₹2000 (hardcoded for each employee)
        // HRA: 50% of basic salary
        // PA: Balance amount (remaining after Basic + Conveyance + HRA)
        const basic = Math.round(baseSalary * 0.50);
        const conveyance = 2000; // Hardcoded ₹2000 for each employee
        const houseRentAllowance = Math.round(basic * 0.50); // 50% of basic
        const personalAllowance = baseSalary - basic - conveyance - houseRentAllowance; // Balance amount

        // Calculate deductions based on unpaid leave
        // IMPORTANT: Since weekends (Sat/Sun) are paid week offs, salary is based on total days
        // But deductions should only be for unpaid working days
        // Daily working day salary = baseSalary / workingDays (not totalDays)
        const dailyWorkingDaySalary = baseSalary / workingDays;
        const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * dailyWorkingDaySalary);
        const totalDeduction = unpaidLeaveDeduction;

        // Calculate net salary
        const totalEarning = basic + houseRentAllowance + personalAllowance + conveyance;
        const netSalary = totalEarning - totalDeduction;

        // Get current leave balances
        const leaveRemaining = parseFloat(employee.leave_balance) || 0;
        const leaveAllotted = parseFloat(employee.leave_allotted) || 0;

        return {
            employee_code: employee.employee_code,
            employee_name: employee.name,
            designation: employee.designation || 'Employee',
            date_of_joining: employee.date_of_joining || null,
            bank_name: employee.bank_name || null, // You may need to add this field
            ifsc: employee.ifsc || null, // You may need to add this field
            bank_account_number: employee.bank_account_number || null, // You may need to add this field
            aadhaar_number: employee.aadhaar_number || null, // You may need to add this field
            pan: employee.pan || null, // You may need to add this field
            basic: basic,
            conveyance: conveyance,
            house_rent_allowance: houseRentAllowance,
            personal_allowance: personalAllowance,
            total_earning: totalEarning,
            paid_leave: leaveDays,
            unpaid_leave: unpaidLeaveDays,
            paid_leave_deduction: 0, // Paid leave is not deducted
            unpaid_leave_deduction: unpaidLeaveDeduction,
            total_deduction: totalDeduction,
            net_salary: netSalary,
            leave_remaining: leaveRemaining,
            leave_allotted: leaveAllotted,
            month: month,
            year: year,
            present_days: presentDays,
            total_days: totalDays,
            working_days: workingDays,
            week_offs: weekOffs // Saturday and Sunday count
        };
    }

    /**
     * Get attendance records for a month
     */
    static async getAttendanceForMonth(employeeCode, startDate, endDate) {
        const [records] = await promisePool.query(
            `SELECT * FROM attendance_records 
            WHERE employee_code = ? 
            AND attendance_date >= ? 
            AND attendance_date <= ?
            ORDER BY attendance_date`,
            [employeeCode, startDate, endDate]
        );
        return records;
    }

    /**
     * Get leave usage for a month
     */
    static async getLeaveUsageForMonth(employeeCode, startDate, endDate) {
        const [records] = await promisePool.query(
            `SELECT 
                SUM(CASE WHEN leave_type = 'leave' AND transaction_type = 'debit' THEN amount ELSE 0 END) as leave_days
            FROM leave_ledger
            WHERE employee_code = ?
            AND reference_date >= ?
            AND reference_date <= ?
            AND transaction_type = 'debit'`,
            [employeeCode, startDate, endDate]
        );

        return {
            leave_days: parseFloat(records[0]?.leave_days) || 0
        };
    }

    /**
     * Calculate working days (excluding weekends)
     */
    static calculateWorkingDays(startDate, endDate) {
        let workingDays = 0;
        const start = moment(startDate);
        const end = moment(endDate);

        while (start.isSameOrBefore(end)) {
            const dayOfWeek = start.day();
            // Count Monday to Friday as working days
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
            }
            start.add(1, 'day');
        }

        return workingDays;
    }
}

module.exports = SalarySlipService;
