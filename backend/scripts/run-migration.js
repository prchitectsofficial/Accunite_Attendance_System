/**
 * Run Database Migration Script
 * This script runs the designation migration
 * 
 * Usage:
 * node backend/scripts/run-migration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { promisePool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('\n🚀 Running database migration: Add designation column\n');
    
    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../../database/migration_add_designation.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Check if column already exists
        const [existingColumns] = await promisePool.query(
            `SHOW COLUMNS FROM employees LIKE 'designation'`
        );
        
        if (existingColumns.length > 0) {
            console.log('✅ Designation column already exists!');
        } else {
            // Add designation column
            try {
                await promisePool.query(
                    `ALTER TABLE employees 
                    ADD COLUMN designation VARCHAR(255) NULL COMMENT 'Employee designation/position' AFTER name`
                );
                console.log('✅ Designation column added successfully!');
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  Column already exists, skipping...');
                } else {
                    throw error;
                }
            }
        }
        
        // Verify the column was added
        const [columns] = await promisePool.query(
            `DESCRIBE employees`
        );
        
        const hasDesignation = columns.some(col => col.Field === 'designation');
        
        if (hasDesignation) {
            console.log('\n✅ Migration completed successfully!');
            console.log('✅ Designation column exists in employees table\n');
        } else {
            console.log('\n⚠️  Migration completed but designation column not found. Please check manually.\n');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration();
