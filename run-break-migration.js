/**
 * Add total_break_minutes Column Migration Script
 * Run this from the root directory: node run-break-migration.js
 */

const path = require('path');

// Load environment variables
require('dotenv').config();

// Get database config
const { promisePool } = require('./backend/src/config/database');

async function runMigration() {
    console.log('\n🚀 Running migration: Add total_break_minutes column\n');
    
    try {
        // Check if column already exists
        const [columns] = await promisePool.query(
            `SHOW COLUMNS FROM attendance_records LIKE 'total_break_minutes'`
        );
        
        if (columns.length > 0) {
            console.log('✅ total_break_minutes column already exists!');
        } else {
            // Add column
            await promisePool.query(
                `ALTER TABLE attendance_records 
                ADD COLUMN total_break_minutes INT NULL DEFAULT 0 COMMENT 'Cumulative break minutes for the day (supports multiple breaks)' AFTER break_stop_time`
            );
            console.log('✅ total_break_minutes column added successfully!');
        }
        
        console.log('\n✅ Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Column already exists, skipping...');
            process.exit(0);
        } else {
            console.error('\n❌ Migration failed:', error.message);
            console.error('Error details:', error);
            process.exit(1);
        }
    }
}

runMigration();
