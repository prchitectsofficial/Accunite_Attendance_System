/**
 * Add Attendance Columns Migration Script
 * Adds break_start_time, break_stop_time, total_working_minutes, late_minutes, overtime_minutes
 */

const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

// Get the correct path to database config
const dbPath = path.resolve(__dirname, '../src/config/database.js');
const { promisePool } = require(dbPath);

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
            // Add columns
            await promisePool.query(
                `ALTER TABLE attendance_records 
                ADD COLUMN break_start_time DATETIME NULL COMMENT 'Break start time' AFTER clock_out_time,
                ADD COLUMN break_stop_time DATETIME NULL COMMENT 'Break stop time' AFTER break_start_time,
                ADD COLUMN total_working_minutes INT NULL COMMENT 'Total working minutes (excluding breaks)' AFTER break_stop_time,
                ADD COLUMN late_minutes INT NULL COMMENT 'Late minutes if worked less than 570 mins' AFTER total_working_minutes,
                ADD COLUMN overtime_minutes INT NULL COMMENT 'Overtime minutes if worked more than 570 mins' AFTER late_minutes`
            );
            console.log('✅ Attendance columns added successfully!');
        }
        
        console.log('\n✅ Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Columns already exist, skipping...');
            process.exit(0);
        } else {
            console.error('\n❌ Migration failed:', error.message);
            console.error('Error details:', error);
            process.exit(1);
        }
    }
}

runMigration();
