-- ============================================
-- MIGRATION: Remove clock time requirement constraint
-- Run this script if you have an existing database
-- ============================================

USE accunite_attendance;

-- For MySQL 8.0.16+, CHECK constraints are enforced
-- To remove the constraint, we need to alter the table
-- Since MySQL doesn't name CHECK constraints by default,
-- we'll need to recreate the constraint or modify the table

-- The simplest approach: The application code no longer enforces this,
-- so if you get constraint errors, you can:

-- Option 1: If your MySQL version supports it, try to find and drop the constraint
-- (This may not work if the constraint wasn't named)

-- Option 2: Recreate the table (BACKUP FIRST!)
-- This is the safest approach if you're getting constraint errors

-- Step 1: Backup your data
-- mysqldump -u root -p accunite_attendance employees > employees_backup.sql

-- Step 2: Drop and recreate the table (run the updated schema.sql)
-- Or manually remove the CHECK constraint by recreating the table structure

-- For now, the application will work without clock times
-- If you encounter constraint errors when adding employees without clock times,
-- you'll need to modify the table structure manually

-- To check if constraint exists:
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM information_schema.CHECK_CONSTRAINTS
WHERE TABLE_SCHEMA = 'accunite_attendance'
AND TABLE_NAME = 'employees';

-- If you see a constraint about clocking schedule, you may need to:
-- 1. Export table data
-- 2. Drop the table
-- 3. Recreate using the updated schema.sql (without the CHECK constraint)
-- 4. Import the data back
