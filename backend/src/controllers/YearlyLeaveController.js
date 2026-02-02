const YearlyLeaveService = require('../services/YearlyLeaveService');
const moment = require('moment');

/**
 * Yearly Leave Controller
 * Handles yearly leave allocation endpoints
 */
class YearlyLeaveController {
    
    /**
     * Allocate yearly leaves (Admin only)
     * POST /api/yearly-leaves/allocate
     */
    static async allocateYearlyLeaves(req, res) {
        try {
            const { year } = req.body;
            const allocationYear = year || moment().year();
            
            // Check if already allocated
            const checkResult = await YearlyLeaveService.checkYearlyAllocation(allocationYear);
            if (checkResult.is_allocated) {
                return res.status(400).json({
                    error: 'Already Allocated',
                    message: `Yearly leaves for ${allocationYear} have already been allocated.`,
                    details: checkResult
                });
            }
            
            const result = await YearlyLeaveService.allocateYearlyLeaves(allocationYear);
            
            res.json({
                success: true,
                message: `Yearly leaves allocated successfully for ${allocationYear}`,
                data: result
            });
        } catch (error) {
            console.error('Yearly leave allocation error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
    
    /**
     * Check yearly allocation status
     * GET /api/yearly-leaves/status?year=2026
     */
    static async checkAllocationStatus(req, res) {
        try {
            const { year } = req.query;
            const checkYear = year ? parseInt(year) : moment().year();
            
            const result = await YearlyLeaveService.checkYearlyAllocation(checkYear);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Check allocation status error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
}

module.exports = YearlyLeaveController;
