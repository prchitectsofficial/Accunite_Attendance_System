const { promisePool } = require('../config/database');

/**
 * Freelancer Model
 * Handles freelancer master data and session tracking
 */
class FreelancerModel {
    
    /**
     * Get all active freelancers
     */
    static async getAll() {
        const [rows] = await promisePool.query(
            "SELECT id as freelancer_id, freelancer_code, name, email, password_hash, password_plain, hourly_rate, status FROM freelancers WHERE status = 'active' ORDER BY COALESCE(name, '')"
        );
        return rows;
    }

    /**
     * Get freelancer by ID
     */
    static async getById(freelancerId) {
        const [rows] = await promisePool.query(
            "SELECT id as freelancer_id, freelancer_code, name, email, password_hash, password_plain, hourly_rate, status FROM freelancers WHERE id = ? AND status = 'active'",
            [freelancerId]
        );
        return rows[0];
    }

    /**
     * Create new freelancer
     */
    static async create(freelancerData) {
        const { name, hourly_rate, freelancer_code } = freelancerData;

        // Only insert name, hourly_rate, and freelancer_code initially
        // Email and password can be assigned later via credential assignment
        const [result] = await promisePool.query(
            'INSERT INTO freelancers (name, hourly_rate, freelancer_code) VALUES (?, ?, ?)',
            [name, hourly_rate, freelancer_code]
        );

        return this.getById(result.insertId);
    }

    /**
     * Update freelancer details
     */
    static async update(freelancerId, updateData) {
        const allowed = ['name', 'hourly_rate', 'status', 'email', 'password_hash', 'password_plain', 'freelancer_code'];
        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (allowed.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(freelancerId);

        const [result] = await promisePool.query(
            `UPDATE freelancers SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            throw new Error('Freelancer not found');
        }

        return this.getById(freelancerId);
    }

    /**
     * Get freelancer by email
     */
    static async getByEmail(email) {
        const [rows] = await promisePool.query(
            "SELECT id as freelancer_id, freelancer_code, name, email, password_hash, password_plain, hourly_rate, status FROM freelancers WHERE email = ? AND status = 'active'",
            [email]
        );
        return rows[0];
    }

    /**
     * Soft delete freelancer
     */
    static async delete(freelancerId) {
        const [result] = await promisePool.query(
            'UPDATE freelancers SET status = ? WHERE id = ?',
            ['inactive', freelancerId]
        );

        return result.affectedRows > 0;
    }

    /**
     * Record login (clock-in) for freelancer
     */
    static async clockIn(freelancerId) {
        // Check if already clocked in (incomplete session exists)
        const [existing] = await promisePool.query(
            'SELECT * FROM freelancer_sessions WHERE freelancer_id = ? AND is_complete = FALSE ORDER BY login_time DESC LIMIT 1',
            [freelancerId]
        );

        if (existing.length > 0) {
            throw new Error('Freelancer already clocked in. Please clock out first.');
        }

        const now = new Date();
        const [result] = await promisePool.query(
            'INSERT INTO freelancer_sessions (freelancer_id, login_time, session_date) VALUES (?, ?, ?)',
            [freelancerId, now, now.toISOString().split('T')[0]]
        );

        return this.getSessionById(result.insertId);
    }

    /**
     * Record logout (clock-out) for freelancer
     * Session duration is auto-calculated by database trigger
     */
    static async clockOut(freelancerId, workSummary = null) {
        // Get the last incomplete session
        const [sessions] = await promisePool.query(
            'SELECT * FROM freelancer_sessions WHERE freelancer_id = ? AND is_complete = FALSE ORDER BY login_time DESC LIMIT 1',
            [freelancerId]
        );

        if (sessions.length === 0) {
            throw new Error('No active session found. Please clock in first.');
        }

        const sessionId = sessions[0].session_id;
        const session = sessions[0];
        const now = new Date();

        // Calculate duration manually (in case trigger doesn't fire)
        const loginTime = new Date(session.login_time);
        const durationMinutes = Math.round((now - loginTime) / (1000 * 60));

        // Update logout time, work summary, duration, and is_complete
        const [result] = await promisePool.query(
            `UPDATE freelancer_sessions 
             SET logout_time = ?, 
                 work_summary = ?,
                 session_duration_minutes = ?,
                 is_complete = TRUE
             WHERE session_id = ?`,
            [now, workSummary, durationMinutes, sessionId]
        );

        // Return updated session with all calculated fields
        return this.getSessionById(sessionId);
    }

    /**
     * Get session by ID
     */
    static async getSessionById(sessionId) {
        const [rows] = await promisePool.query(
            `SELECT 
                fs.*,
                ROUND(fs.session_duration_minutes / 60.0 * f.hourly_rate, 2) as session_value
            FROM freelancer_sessions fs
            INNER JOIN freelancers f ON fs.freelancer_id = f.id
            WHERE fs.session_id = ?`,
            [sessionId]
        );
        return rows[0];
    }

    /**
     * Get all sessions for a freelancer
     * Ordered by date descending (most recent first)
     */
    static async getSessions(freelancerId, startDate = null, endDate = null) {
        let query = `
            SELECT 
                fs.*,
                ROUND(fs.session_duration_minutes / 60.0 * f.hourly_rate, 2) as session_value
            FROM freelancer_sessions fs
            INNER JOIN freelancers f ON fs.freelancer_id = f.id
            WHERE fs.freelancer_id = ?
        `;
        const params = [freelancerId];

        if (startDate) {
            query += ' AND fs.session_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND fs.session_date <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY fs.session_date DESC, fs.login_time DESC';

        const [rows] = await promisePool.query(query, params);
        return rows;
    }

    /**
     * Get incomplete sessions (no logout)
     */
    static async getIncompleteSessions() {
        const [rows] = await promisePool.query(`
            SELECT 
                fs.*,
                f.name as freelancer_name
            FROM freelancer_sessions fs
            INNER JOIN freelancers f ON fs.freelancer_id = f.id
            WHERE fs.is_complete = FALSE
            ORDER BY fs.login_time DESC
        `);
        return rows;
    }
}

module.exports = FreelancerModel;
