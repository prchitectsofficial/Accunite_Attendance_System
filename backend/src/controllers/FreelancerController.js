const FreelancerModel = require('../models/FreelancerModel');
const bcrypt = require('bcryptjs');

/**
 * Freelancer Controller
 * Handles freelancer management and session tracking
 */
class FreelancerController {
    
    /**
     * Get all freelancers
     */
    static async getAllFreelancers(req, res) {
        try {
            const freelancers = await FreelancerModel.getAll();
            res.json({
                success: true,
                count: freelancers.length,
                data: freelancers
            });
        } catch (error) {
            console.error('Get freelancers error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get freelancer by ID
     */
    static async getFreelancer(req, res) {
        try {
            const { freelancerId } = req.params;
            const freelancer = await FreelancerModel.getById(freelancerId);
            
            if (!freelancer) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Freelancer not found'
                });
            }

            res.json({
                success: true,
                data: freelancer
            });
        } catch (error) {
            console.error('Get freelancer error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Create new freelancer
     */
    static async createFreelancer(req, res) {
        try {
            const { name, hourly_rate, freelancer_code } = req.body;

            if (!name || !hourly_rate || !freelancer_code) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Name, hourly rate, and freelancer code are required'
                });
            }

            const freelancer = await FreelancerModel.create({ name, hourly_rate, freelancer_code });

            res.status(201).json({
                success: true,
                message: 'Freelancer created successfully',
                data: freelancer
            });
        } catch (error) {
            console.error('Create freelancer error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Update freelancer
     */
    static async updateFreelancer(req, res) {
        try {
            const { freelancerId } = req.params;
            const updateData = req.body;

            const freelancer = await FreelancerModel.update(freelancerId, updateData);

            res.json({
                success: true,
                message: 'Freelancer updated successfully',
                data: freelancer
            });
        } catch (error) {
            console.error('Update freelancer error:', error);
            
            if (error.message === 'Freelancer not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: error.message
                });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Delete freelancer (soft delete)
     */
    static async deleteFreelancer(req, res) {
        try {
            const { freelancerId } = req.params;
            const id = parseInt(freelancerId);
            if (isNaN(id)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid freelancer ID'
                });
            }
            const deleted = await FreelancerModel.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Freelancer not found'
                });
            }

            res.json({
                success: true,
                message: 'Freelancer deleted successfully'
            });
        } catch (error) {
            console.error('Delete freelancer error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Clock in freelancer
     */
    static async clockIn(req, res) {
        try {
            const { freelancerId } = req.params;
            const id = parseInt(freelancerId);
            if (isNaN(id)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid freelancer ID'
                });
            }
            const session = await FreelancerModel.clockIn(id);

            res.json({
                success: true,
                message: 'Clocked in successfully',
                data: session
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
     * Clock out freelancer
     */
    static async clockOut(req, res) {
        try {
            const { freelancerId } = req.params;
            const { work_summary } = req.body;
            const id = parseInt(freelancerId);
            if (isNaN(id)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid freelancer ID'
                });
            }
            if (!work_summary || !work_summary.trim()) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Work summary is required'
                });
            }
            const session = await FreelancerModel.clockOut(id, work_summary.trim());

            res.json({
                success: true,
                message: 'Clocked out successfully',
                data: session
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
     * Get freelancer sessions
     */
    static async getSessions(req, res) {
        try {
            const { freelancerId } = req.params;
            const { start_date, end_date } = req.query;

            const sessions = await FreelancerModel.getSessions(
                freelancerId,
                start_date,
                end_date
            );

            res.json({
                success: true,
                count: sessions.length,
                data: sessions
            });
        } catch (error) {
            console.error('Get sessions error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Get incomplete sessions
     */
    static async getIncompleteSessions(req, res) {
        try {
            const sessions = await FreelancerModel.getIncompleteSessions();

            res.json({
                success: true,
                count: sessions.length,
                data: sessions
            });
        } catch (error) {
            console.error('Get incomplete sessions error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    /**
     * Assign credentials to freelancer
     */
    static async assignCredentials(req, res) {
        try {
            const { freelancerId } = req.params;
            const { email, password } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Email is required'
                });
            }

            // Check if freelancer exists
            const existingFreelancer = await FreelancerModel.getById(freelancerId);
            if (!existingFreelancer) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Freelancer not found'
                });
            }

            // If password is provided, hash it and store plain text for admin viewing
            const updateData = {
                email
            };

            if (password) {
                // Hash new password for security
                updateData.password_hash = await bcrypt.hash(password, 10);
                // Store plain text for admin viewing (as per requirement)
                updateData.password_plain = password;
            } else if (!existingFreelancer.password_hash) {
                // Password required for new credentials
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Password is required for new credentials'
                });
            }
            // If password not provided but freelancer has existing password, don't update password_hash or password_plain

            const freelancer = await FreelancerModel.update(freelancerId, updateData);

            res.json({
                success: true,
                message: 'Credentials assigned successfully',
                data: {
                    freelancer_id: freelancer.freelancer_id,
                    name: freelancer.name,
                    email: freelancer.email
                }
            });
        } catch (error) {
            console.error('Assign credentials error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
}

module.exports = FreelancerController;
