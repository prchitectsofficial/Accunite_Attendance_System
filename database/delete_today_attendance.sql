-- Delete today's attendance for all users
USE accunite_attendance;

-- Delete all attendance records for today's date
DELETE FROM attendance_records 
WHERE attendance_date = CURDATE();

-- Verify deletion
SELECT COUNT(*) as deleted_count FROM attendance_records WHERE attendance_date = CURDATE();
