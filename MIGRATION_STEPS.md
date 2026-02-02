# Database Migration Steps

## Add total_break_minutes Column

### Option 1: Using MySQL Command Line (Easiest)

1. **Open Command Prompt** (Press `Win + R`, type `cmd`, press Enter)

2. **Connect to MySQL:**
   ```bash
   mysql -u root -p
   ```
   (Enter password: `admin` when prompted)

3. **Run these commands one by one:**
   ```sql
   USE accunite_attendance;
   ```
   
   ```sql
   ALTER TABLE attendance_records 
   ADD COLUMN total_break_minutes INT NULL DEFAULT 0 COMMENT 'Cumulative break minutes for the day (supports multiple breaks)' AFTER break_stop_time;
   ```

4. **Verify the column was added:**
   ```sql
   DESCRIBE attendance_records;
   ```
   You should see `total_break_minutes` in the list.

5. **Exit MySQL:**
   ```sql
   EXIT;
   ```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Open the SQL file: `database/migration_add_break_minutes_column.sql`
4. Execute the SQL statement

### Option 3: Using Node.js Script (if .env has correct password)

From project root directory:
```bash
node run-break-migration.js
```

**Note:** Make sure your `.env` file in the root directory has:
```
DB_USER=root
DB_PASSWORD=admin
DB_NAME=accunite_attendance
```

## What This Migration Does

Adds `total_break_minutes` column to track cumulative break time for multiple breaks per day.

After this migration:
- Employees can take multiple breaks in a day
- All break times are tracked cumulatively
- Late time and overtime calculations include total break time
