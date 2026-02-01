const { promisePool } = require('../config/database');
const moment = require('moment');

/**
 * Report Service
 * Generates various attendance and leave reports
 */
class ReportService {
    
    /**
     * Get employee summary
     * Shows working days, present, absent, leaves, etc.
     */
    static async getEmployeeSummary(employeeCode, startDate = null, endDate = null) {
        // If no dates provided, use current month
        if (!startDate || !endDate) {
            startDate = moment().startOf('month').format('YYYY-MM-DD');
            endDate = moment().endOf('month').format('YYYY-MM-DD');
        }

        // Use the view created in schema
        const [summary] = await promisePool.query(
            `SELECT 
                e.employee_code,
                e.name,
                e.attendance_type,
                e.cl_balance,
                e.pl_balance,
                COUNT(DISTINCT CASE WHEN ar.status = 'present' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as days_present,
                COUNT(DISTINCT CASE WHEN ar.status = 'absent' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as days_absent,
                COUNT(DISTINCT CASE WHEN ar.status = 'cl' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as cl_used,
                COUNT(DISTINCT CASE WHEN ar.status = 'pl' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as pl_used,
                COUNT(DISTINCT CASE WHEN ar.is_late = TRUE AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as late_arrivals,
                COUNT(DISTINCT CASE WHEN ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as total_records
            FROM employees e
            LEFT JOIN attendance_records ar ON e.employee_code COLLATE utf8mb4_unicode_ci = ar.employee_code COLLATE utf8mb4_unicode_ci
            WHERE e.employee_code COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND e.status COLLATE utf8mb4_unicode_ci = 'active'
            GROUP BY e.employee_code, e.name, e.attendance_type, e.leave_balance, e.leave_allotted`,
            [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, employeeCode]
        );

        if (summary.length === 0) {
            throw new Error('Employee not found');
        }

        return {
            ...summary[0],
            period: {
                start_date: startDate,
                end_date: endDate
            }
        };
    }

    /**
     * Get all employees summary
     */
    static async getAllEmployeesSummary(startDate = null, endDate = null) {
        if (!startDate || !endDate) {
            startDate = moment().startOf('month').format('YYYY-MM-DD');
            endDate = moment().endOf('month').format('YYYY-MM-DD');
        }

        const [summaries] = await promisePool.query(
            `SELECT 
                e.employee_code,
                e.name,
                e.attendance_type,
                e.cl_balance,
                e.pl_balance,
                COUNT(DISTINCT CASE WHEN ar.status = 'present' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as days_present,
                COUNT(DISTINCT CASE WHEN ar.status = 'absent' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as days_absent,
                COUNT(DISTINCT CASE WHEN ar.status = 'cl' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as cl_used,
                COUNT(DISTINCT CASE WHEN ar.status = 'pl' AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as pl_used,
                COUNT(DISTINCT CASE WHEN ar.is_late = TRUE AND ar.attendance_date BETWEEN ? AND ? THEN ar.attendance_date END) as late_arrivals
            FROM employees e
            LEFT JOIN attendance_records ar ON e.employee_code COLLATE utf8mb4_unicode_ci = ar.employee_code COLLATE utf8mb4_unicode_ci
            WHERE e.status COLLATE utf8mb4_unicode_ci = 'active'
            GROUP BY e.employee_code, e.name, e.attendance_type, e.leave_balance, e.leave_allotted
            ORDER BY e.name`,
            [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]
        );

        return {
            summaries,
            period: {
                start_date: startDate,
                end_date: endDate
            }
        };
    }

    /**
     * Get daily attendance report
     */
    static async getDailyAttendanceReport(date) {
        // Get all active employees first
        const [allEmployees] = await promisePool.query(
            "SELECT employee_code, name, attendance_type FROM employees WHERE status COLLATE utf8mb4_unicode_ci = 'active'",
            []
        );

        // Get attendance records for the date
        const [records] = await promisePool.query(
            `SELECT 
                ar.*,
                e.name as employee_name,
                e.attendance_type
            FROM attendance_records ar
            INNER JOIN employees e ON ar.employee_code COLLATE utf8mb4_unicode_ci = e.employee_code COLLATE utf8mb4_unicode_ci
            WHERE ar.attendance_date = ?
            AND e.status COLLATE utf8mb4_unicode_ci = 'active'
            ORDER BY e.name`,
            [date]
        );

        const markedEmployees = new Set(records.map(r => r.employee_code));
        const unmarkedEmployees = allEmployees.filter(emp => !markedEmployees.has(emp.employee_code));

        // Count present employees (those with status 'present' or clock_in_time set)
        const presentCount = records.filter(r => 
            r.status === 'present' || (r.clock_in_time && !r.clock_out_time)
        ).length;

        // Count on leave: employees with status 'cl' or 'pl' + employees who haven't clocked in yet
        const onLeaveFromRecords = records.filter(r => r.status === 'cl' || r.status === 'pl').length;
        const onLeaveCount = onLeaveFromRecords + unmarkedEmployees.length;

        return {
            date,
            marked_attendance: records,
            unmarked_employees: unmarkedEmployees,
            summary: {
                total_employees: allEmployees.length,
                marked: records.length,
                unmarked: unmarkedEmployees.length,
                present: presentCount,
                on_leave: onLeaveCount
            }
        };
    }

    /**
     * Get freelancer work summary
     */
    static async getFreelancerSummary(freelancerId, startDate = null, endDate = null) {
        if (!startDate || !endDate) {
            startDate = moment().startOf('month').format('YYYY-MM-DD');
            endDate = moment().endOf('month').format('YYYY-MM-DD');
        }

        const [sessions] = await promisePool.query(
            `SELECT 
                fs.*,
                f.name,
                f.hourly_rate,
                ROUND(fs.session_duration_minutes / 60.0 * f.hourly_rate, 2) as session_value
            FROM freelancer_sessions fs
            INNER JOIN freelancers f ON fs.freelancer_id = f.freelancer_id
            WHERE fs.freelancer_id = ?
            AND fs.session_date BETWEEN ? AND ?
            ORDER BY fs.session_date DESC, fs.login_time DESC`,
            [freelancerId, startDate, endDate]
        );

        const totalMinutes = sessions.reduce((sum, s) => sum + (s.session_duration_minutes || 0), 0);
        const totalValue = sessions.reduce((sum, s) => sum + parseFloat(s.session_value || 0), 0);

        return {
            freelancer_id: freelancerId,
            name: sessions[0]?.name || 'Unknown',
            hourly_rate: sessions[0]?.hourly_rate || 0,
            period: {
                start_date: startDate,
                end_date: endDate
            },
            sessions: sessions,
            summary: {
                total_sessions: sessions.length,
                complete_sessions: sessions.filter(s => s.is_complete).length,
                incomplete_sessions: sessions.filter(s => !s.is_complete).length,
                total_hours: (totalMinutes / 60).toFixed(2),
                total_value: totalValue.toFixed(2)
            }
        };
    }

    /**
     * Get incomplete sessions report (no logout)
     */
    static async getIncompleteSessionsReport() {
        const [sessions] = await promisePool.query(
            `SELECT 
                fs.*,
                f.name as freelancer_name,
                TIMESTAMPDIFF(HOUR, fs.login_time, NOW()) as hours_since_login
            FROM freelancer_sessions fs
            INNER JOIN freelancers f ON fs.freelancer_id = f.freelancer_id
            WHERE fs.is_complete = FALSE
            ORDER BY fs.login_time DESC`
        );

        return sessions;
    }

    /**
     * Get late arrivals report
     */
    static async getLateArrivalsReport(startDate, endDate) {
        const [records] = await promisePool.query(
            `SELECT 
                ar.attendance_date,
                ar.clock_in_time,
                ar.employee_code,
                e.name as employee_name,
                e.clock_start_time as scheduled_time,
                TIMEDIFF(TIME(ar.clock_in_time), e.clock_start_time) as late_by
            FROM attendance_records ar
            INNER JOIN employees e ON ar.employee_code COLLATE utf8mb4_unicode_ci = e.employee_code COLLATE utf8mb4_unicode_ci
            WHERE ar.is_late = TRUE
            AND ar.attendance_date BETWEEN ? AND ?
            AND e.status COLLATE utf8mb4_unicode_ci = 'active'
            ORDER BY ar.attendance_date DESC, ar.clock_in_time`,
            [startDate, endDate]
        );

        return {
            period: { start_date: startDate, end_date: endDate },
            late_arrivals: records,
            total_count: records.length
        };
    }

    /**
     * Get leave usage report
     */
    static async getLeaveUsageReport(startDate, endDate) {
        const [records] = await promisePool.query(
            `SELECT 
                e.employee_code,
                e.name,
                e.leave_balance as current_leave,
                e.leave_allotted as leave_allotted,
                COUNT(CASE WHEN ar.status = 'leave' THEN 1 END) as leave_used
            FROM employees e
            LEFT JOIN attendance_records ar ON e.employee_code COLLATE utf8mb4_unicode_ci = ar.employee_code COLLATE utf8mb4_unicode_ci
                AND ar.attendance_date BETWEEN ? AND ?
            WHERE e.status COLLATE utf8mb4_unicode_ci = 'active'
            GROUP BY e.employee_code, e.name, e.leave_balance, e.leave_allotted
            ORDER BY e.name`,
            [startDate, endDate]
        );

        return {
            period: { start_date: startDate, end_date: endDate },
            employees: records
        };
    }
}

module.exports = ReportService;
