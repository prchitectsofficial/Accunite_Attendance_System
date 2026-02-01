-- Update freelancer session login time
-- Replace the values below with actual session_id and new login time

USE accunite_attendance;

-- First, find the session you want to update
-- Replace 'Pankaj' with the freelancer name and adjust the date if needed
SELECT 
    fs.session_id,
    fs.freelancer_id,
    f.name as freelancer_name,
    fs.login_time,
    fs.logout_time,
    fs.session_date
FROM freelancer_sessions fs
INNER JOIN freelancers f ON fs.freelancer_id = f.id
WHERE f.name = 'Pankaj'
AND fs.session_date = '2026-01-22'
ORDER BY fs.login_time DESC;

-- Once you have the session_id, update the login time
-- Replace SESSION_ID with the actual session_id from above query
-- Replace '2026-01-22 13:02:19' with your desired date and time
UPDATE freelancer_sessions 
SET login_time = '2026-01-22 13:02:19',
    session_date = DATE('2026-01-22 13:02:19')
WHERE session_id = SESSION_ID;

-- Verify the update
SELECT 
    fs.session_id,
    f.name as freelancer_name,
    fs.login_time,
    fs.logout_time,
    fs.session_date,
    fs.session_duration_minutes
FROM freelancer_sessions fs
INNER JOIN freelancers f ON fs.freelancer_id = f.id
WHERE fs.session_id = SESSION_ID;
