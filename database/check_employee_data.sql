-- Check employee data to see attendance_type values
USE accunite_attendance;

-- Check a few employees to see their attendance_type
SELECT employee_code, name, attendance_type, status FROM employees LIMIT 5;

-- If attendance_type is stored in uppercase, we might need to update them
-- But the code should handle both cases now
