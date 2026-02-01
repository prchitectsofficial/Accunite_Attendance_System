-- Migration: Remove CL/PL, Add single Leave system
-- This migration converts the leave system from CL/PL to a single "Leave" type

USE accunite_attendance;

-- Step 1: Add new leave columns to employees table
ALTER TABLE employees 
ADD COLUMN leave_balance DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Leave balance (assigned by admin)' AFTER pl_balance,
ADD COLUMN leave_allotted DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total leaves allotted by admin' AFTER leave_balance;

-- Step 2: Migrate existing CL and PL balances to leave_balance
UPDATE employees 
SET leave_balance = COALESCE(cl_balance, 0) + COALESCE(pl_balance, 0),
    leave_allotted = COALESCE(cl_balance, 0) + COALESCE(pl_balance, 0)
WHERE status = 'active';

-- Step 3: Update leave_ledger table to support 'leave' type
-- First, update existing records to 'leave' type
UPDATE leave_ledger 
SET leave_type = 'leave' 
WHERE leave_type IN ('cl', 'pl');

-- Step 4: Modify leave_ledger table to change ENUM
ALTER TABLE leave_ledger 
MODIFY COLUMN leave_type ENUM('leave') NOT NULL;

-- Step 5: Update attendance_records status ENUM to remove 'cl' and 'pl', add 'leave'
-- First update existing records
UPDATE attendance_records 
SET status = 'leave' 
WHERE status IN ('cl', 'pl');

-- Then modify the column
ALTER TABLE attendance_records 
MODIFY COLUMN status ENUM('present', 'absent', 'leave') NOT NULL;

-- Step 6: (Optional) Remove old CL/PL columns from employees table
-- Uncomment these lines if you want to completely remove CL/PL columns
-- ALTER TABLE employees DROP COLUMN cl_balance;
-- ALTER TABLE employees DROP COLUMN pl_balance;

-- Verify the changes
DESCRIBE employees;
DESCRIBE leave_ledger;
DESCRIBE attendance_records;
