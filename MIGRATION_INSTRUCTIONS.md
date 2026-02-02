# Database Migration Instructions

## Add Attendance Columns Migration

You need to add these columns to the `attendance_records` table to fix the clock out error.

### Option 1: Using MySQL Command Line (Recommended)

1. Open MySQL command line:
   ```bash
   mysql -u your_username -p
   ```

2. Enter your MySQL password when prompted

3. Run these commands:
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

4. Verify the columns were added:
   ```sql
   DESCRIBE attendance_records;
   ```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Open the SQL file: `database/migration_add_attendance_columns.sql`
4. Execute the SQL statements

### Option 3: Using Node.js Script

From the project root directory, run:
```bash
node run-attendance-migration.js
```

**Note:** Make sure you're in the project root directory (`C:\Users\manis\Accunite_Attendance_System`) when running the script.

### What This Migration Does

Adds the following columns to `attendance_records` table:
- `break_start_time` - When employee started break
- `break_stop_time` - When employee ended break  
- `total_working_minutes` - Total working time (excluding breaks)
- `late_minutes` - Minutes worked less than standard (570 mins)
- `overtime_minutes` - Minutes worked more than standard (570 mins)

These columns are required for:
- Clock out functionality
- Break tracking
- Working hours calculation
- Late time and overtime calculation
