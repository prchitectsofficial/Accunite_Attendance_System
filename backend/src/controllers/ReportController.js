const ReportService = require('../services/ReportService');

/**
 * Report Controller
 * Handles various attendance and leave reports
 */
class ReportController {
    
    /**
     * Get employee summary
     */
    static async getEmployeeSummary(req, res) {
        try {
            const { employeeCode } = req.params;
            const { start_date, end_date } = req.query;

            const summary = await ReportService.getEmployeeSummary(
                employeeCode,
                start_date,
                end_date
            );

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Get employee summary error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get all employees summary
     */
    static async getAllEmployeesSummary(req, res) {
        try {
            const { start_date, end_date } = req.query;

            const summary = await ReportService.getAllEmployeesSummary(
                start_date,
                end_date
            );

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Get all employees summary error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get daily attendance report
     */
    static async getDailyAttendanceReport(req, res) {
        try {
            const { date } = req.params;

            const report = await ReportService.getDailyAttendanceReport(date);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get daily attendance report error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get freelancer summary
     */
    static async getFreelancerSummary(req, res) {
        try {
            const { freelancerId } = req.params;
            const { start_date, end_date } = req.query;

            const summary = await ReportService.getFreelancerSummary(
                freelancerId,
                start_date,
                end_date
            );

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Get freelancer summary error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get incomplete sessions report
     */
    static async getIncompleteSessionsReport(req, res) {
        try {
            const report = await ReportService.getIncompleteSessionsReport();

            res.json({
                success: true,
                count: report.length,
                data: report
            });
        } catch (error) {
            console.error('Get incomplete sessions report error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get late arrivals report
     */
    static async getLateArrivalsReport(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Start date and end date are required'
                });
            }

            const report = await ReportService.getLateArrivalsReport(
                start_date,
                end_date
            );

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get late arrivals report error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get leave usage report
     */
    static async getLeaveUsageReport(req, res) {
        try {
            const { start_date, end_date } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Start date and end date are required'
                });
            }

            const report = await ReportService.getLeaveUsageReport(
                start_date,
                end_date
            );

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Get leave usage report error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
}

module.exports = ReportController;
