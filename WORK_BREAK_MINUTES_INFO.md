# Work and Break Minutes Configuration

## Standard Working Minutes
- **STANDARD_WORKING_MINUTES = 570 minutes** (9.5 hours)
- Defined in: `backend/src/models/AttendanceModel.js` (line 124)
- This is the standard daily working time expected from employees

## Break Minutes
- **Break tracking**: Breaks are tracked with `break_start_time` and `break_stop_time`
- **Break deduction rule**: Break time is only subtracted from total working minutes if the break duration is **more than 30 minutes**
- If break is 30 minutes or less, it's not deducted from working time
- Break is calculated as: `breakMinutes = break_stop_time - break_start_time`

## Calculation Logic
When an employee clocks out:
1. Total working minutes = `clock_out_time - clock_in_time`
2. If break was taken and break duration > 30 minutes:
   - Total working minutes = `(clock_out_time - clock_in_time) - break_minutes`
3. Late minutes calculation:
   - If `total_working_minutes < 570`: `late_minutes = 570 - total_working_minutes`
4. Overtime calculation:
   - If `total_working_minutes > 570`: `overtime_minutes = total_working_minutes - 570`

## Database Columns
- `total_working_minutes` - Total working time excluding breaks (if break > 30 mins)
- `late_minutes` - Minutes worked less than standard (570 mins)
- `overtime_minutes` - Minutes worked more than standard (570 mins)
- `break_start_time` - When break started
- `break_stop_time` - When break ended

## Notes
- The 570 minutes (9.5 hours) standard can be modified in `AttendanceModel.js` if needed
- Break threshold (30 minutes) is hardcoded in the clockOut function
- These values are used for calculating late time and overtime
