-- Allocate 15 leaves to all active employees
USE accunite_attendance;

-- Update all active employees with 15 leaves
UPDATE employees 
SET 
    leave_balance = 15,
    leave_allotted = 15,
    updated_at = NOW()
WHERE status = 'active';

-- Verify the update
SELECT 
    employee_code,
    name,
    leave_balance,
    leave_allotted,
    status
FROM employees 
WHERE status = 'active'
ORDER BY employee_code;
