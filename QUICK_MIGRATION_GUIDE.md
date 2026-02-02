# Quick Migration Guide - Add Attendance Columns

## Simple Steps to Fix Clock Out Error

### Step 1: Open MySQL Command Line

Press `Win + R`, type `cmd` and press Enter, then type:
```bash
mysql -u root -p
```
(Replace `root` with your MySQL username if different)

### Step 2: Enter Your MySQL Password

When prompted, enter your MySQL password.

### Step 3: Copy and Paste These Commands

```sql
USE accunite_attendance;

ALTER TABLE attendance_records 
ADD COLUMN break_start_time DATETIME NULL COMMENT 'Break start time' AFTER clock_out_time;

ALTER TABLE attendance_records 
ADD COLUMN break_stop_time DATETIME NULL COMMENT 'Break stop time' AFTER break_start_time;

ALTER TABLE attendance_records 
ADD COLUMN total_working_minutes INT NULL COMMENT 'Total working minutes (excluding breaks)' AFTER break_stop_time;

ALTER TABLE attendance_records 
ADD COLUMN late_minutes INT NULL COMMENT 'Late minutes if worked less than 570 mins' AFTER total_working_minutes;

ALTER TABLE attendance_records 
ADD COLUMN overtime_minutes INT NULL COMMENT 'Overtime minutes if worked more than 570 mins' AFTER late_minutes;
```

### Step 4: Verify

```sql
DESCRIBE attendance_records;
```

You should see the new columns in the list.

### Step 5: Exit MySQL

```sql
EXIT;
```

## That's It!

After running these commands, the clock out feature will work properly and you'll be able to:
- Clock out with work summary
- Track break times
- Calculate working hours
- See late time and overtime

## Alternative: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Open the file: `database/migration_add_attendance_columns.sql`
4. Execute all statements
