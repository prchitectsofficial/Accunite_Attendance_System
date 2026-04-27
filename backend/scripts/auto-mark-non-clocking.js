#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/opt/node/accunite-attendance/backend/.env' });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function markNonClockingAbsent() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        console.log(`[${new Date().toISOString()}] Running auto-mark for non-clocking employees...`);
        
        // Get all non-clocking employees
        const [employees] = await pool.query(
            "SELECT employee_code FROM employees WHERE attendance_type = 'non-clocking' AND status = 'active'"
        );
        
        console.log(`Found ${employees.length} non-clocking employees`);
        
        let markedCount = 0;
        
        for (const emp of employees) {
            // Check if they have a record for today
            const [records] = await pool.query(
                'SELECT id FROM attendance_records WHERE employee_code = ? AND attendance_date = ?',
                [emp.employee_code, today]
            );
            
            // If no record exists, mark as absent (Not Working)
            if (records.length === 0) {
                await pool.query(
                    `INSERT INTO attendance_records 
                    (employee_code, attendance_date, status, notes) 
                    VALUES (?, ?, 'absent', 'Auto-marked: Not Working')`,
                    [emp.employee_code, today]
                );
                
                console.log(`Marked ${emp.employee_code} as Not Working`);
                markedCount++;
            }
        }
        
        console.log(`[${new Date().toISOString()}] Completed. Marked ${markedCount} employees as Not Working`);
        
        await pool.end();
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

markNonClockingAbsent();
