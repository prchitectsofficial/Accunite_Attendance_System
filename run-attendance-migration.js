/**
 * Add Attendance Columns Migration Script
 * Run this from the root directory: node run-attendance-migration.js
 */

const path = require('path');

// Load environment variables
require('dotenv').config();

// Get database config
const { promisePool } = require('./backend/src/config/database');

async function runMigration() {
    console.log('\n🚀 Running migration: Add attendance columns\n');
    
    try {
        // Check if columns already exist
        const [columns] = await promisePool.query(
            `SHOW COLUMNS FROM attendance_records LIKE 'total_working_minutes'`
        );
        
        if (columns.length > 0) {
            console.log('✅ Attendance columns already exist!');
        } else {
            // Add columns one by one to handle IF NOT EXISTS
            try {
                await promisePool.query(
                    `ALTER TABLE attendance_records 
                    ADD COLUMN break_start_time DATETIME NULL COMMENT 'Break start time' AFTER clock_out_time`
                );
                console.log('✅ Added break_start_time column');
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
            
            try {
                await promisePool.query(
                    `ALTER TABLE attendance_records 
                    ADD COLUMN break_stop_time DATETIME NULL COMMENT 'Break stop time' AFTER break_start_time`
                );
                console.log('✅ Added break_stop_time column');
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
            
            try {
                await promisePool.query(
                    `ALTER TABLE attendance_records 
                    ADD COLUMN total_working_minutes INT NULL COMMENT 'Total working minutes (excluding breaks)' AFTER break_stop_time`
                );
                console.log('✅ Added total_working_minutes column');
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
            
            try {
                await promisePool.query(
                    `ALTER TABLE attendance_records 
                    ADD COLUMN late_minutes INT NULL COMMENT 'Late minutes if worked less than 570 mins' AFTER total_working_minutes`
                );
                console.log('✅ Added late_minutes column');
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
            
            try {
                await promisePool.query(
                    `ALTER TABLE attendance_records 
                    ADD COLUMN overtime_minutes INT NULL COMMENT 'Overtime minutes if worked more than 570 mins' AFTER late_minutes`
                );
                console.log('✅ Added overtime_minutes column');
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
            
            console.log('\n✅ All attendance columns added successfully!');
        }
        
        console.log('\n✅ Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

runMigration();
