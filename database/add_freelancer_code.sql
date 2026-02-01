-- Add freelancer_code column to freelancers table
USE accunite_attendance;

-- Add freelancer_code column
ALTER TABLE freelancers 
ADD COLUMN freelancer_code VARCHAR(50) NULL UNIQUE COMMENT 'Unique code for freelancer (e.g., FL001)' AFTER freelancer_id;

-- Add index for faster lookups
CREATE INDEX idx_freelancer_code ON freelancers(freelancer_code);

-- Verify the column was added
DESCRIBE freelancers;
