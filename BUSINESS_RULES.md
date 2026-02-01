# Accunite Attendance System - Business Rules Documentation

This document outlines all business rules implemented in the system. These rules are critical to system operation and must be understood by all administrators.

## Overview

The system implements 10 core business rules that govern attendance tracking, leave management, and reporting. These rules are enforced at multiple levels: database constraints, backend validation, and business logic.

---

## Rule 1: Employee Types & Attendance Methods

### Clocking Employees
- **MUST** clock in and clock out daily
- Attendance is **automatically marked present** when they clock in
- Late arrival is detected based on schedule + grace period
- If no clock-in on a working day = **ABSENT**

### Non-Clocking Employees
- Attendance **must be manually marked** by admin each day
- Only two states: **PRESENT** or **ABSENT**
- **CRITICAL**: Cannot be marked ABSENT without applying leave (CL/PL)
- System **blocks** absence without leave allocation

**Implementation:**
- `EmployeeModel.create()` validates clocking employees have schedule
- `AttendanceModel.clockIn()` auto-marks present for clocking employees
- `AttendanceModel.markAttendance()` enforces leave requirement for non-clocking

**Code Location:**
- Backend: `models/AttendanceModel.js`
- Database: `employees` table with `attendance_type` enum

---

## Rule 2: Off-Day Login (Critical)

### The Rule
When **any employee** logs in on an off-day (weekend/holiday):
1. **ONLY that specific employee** is marked PRESENT
2. **ALL other employees** remain ABSENT
3. **Leave balances of other employees** are NOT affected

### Why This Matters
- Prevents automatic leave deduction when someone works overtime
- Ensures attendance is employee-specific, not bulk-updated
- Protects leave balances from unintended modifications

**Implementation:**
- `AttendanceModel.clockIn()` accepts `isOffDay` parameter
- When true, only creates attendance record for that employee
- No bulk operations that would affect other employees

**Code Location:**
- Backend: `models/AttendanceModel.js` → `clockIn()` method
- Frontend: Query parameter in clock-in API call

**Example Scenario:**
```
Saturday (off day):
- John logs in to finish a project
- System marks ONLY John as PRESENT
- All other employees: No attendance record created
- No leave deductions for anyone
```

---

## Rule 3: Consecutive CL Conversion

### The Rule
- **CL cannot be used on consecutive days**
- If CL is applied on consecutive days, **automatically convert to PL**
- System notifies user of the conversion
- Conversion is logged in leave ledger

### Conversion Process
1. User applies CL for a date
2. System checks if previous day was also CL
3. If yes:
   - Debit 1 day from CL balance
   - Credit 1 day to PL balance
   - Mark attendance as PL (not CL)
   - Create conversion transaction record
   - Notify user

**Implementation:**
- `AttendanceModel.hasConsecutiveCL()` checks previous day
- `LeaveService.applyLeave()` handles conversion logic
- `LeaveModel.convertCLToPL()` creates dual transactions

**Code Location:**
- Backend: `services/LeaveService.js` → `applyLeave()` method
- Backend: `models/LeaveModel.js` → `convertCLToPL()` method

**Example:**
```
Monday: Apply CL → Approved as CL
Tuesday: Apply CL → Auto-converted to PL
Wednesday: Apply CL → Approved as CL (not consecutive with Tuesday's PL)
```

---

## Rule 4: CL Management Options

### CL Can Be:

#### 1. Encashed
- Convert CL days to monetary value
- **Mandatory notes required**
- Reduces CL balance
- Creates 'encash' transaction record
- Admin action only

#### 2. Carried Forward
- Roll unused CL to next period
- **Mandatory notes required**
- Balance remains same (just logged)
- Creates 'carryforward' transaction record

#### 3. Redeemed
- Manual reduction by admin
- **Mandatory notes required**
- Use case: adjustment, correction
- Creates 'debit' transaction record

**Implementation:**
- All operations require notes (validated in controller)
- `LeaveService` enforces note requirement
- Transactions logged with admin username
- Balance updated atomically with ledger entry

**Code Location:**
- Backend: `services/LeaveService.js`
- Backend: `models/LeaveModel.js`
- Frontend: `pages/LeavesPage.js`

---

## Rule 5: Leave Balance Validation

### Hard Constraints
- Leave balances **CANNOT go negative**
- Enforced at 3 levels:
  1. **Database**: CHECK constraint on cl_balance and pl_balance
  2. **Model**: Validation before transaction
  3. **Service**: Pre-check before applying leave

### When Applied
- Before applying leave
- Before encashing CL
- Before redemption
- Before manual adjustments

**Implementation:**
```sql
-- Database level
CHECK (cl_balance >= 0)
CHECK (pl_balance >= 0)

-- Model level
if (newBalance < 0) {
    throw new Error('Insufficient balance');
}
```

**Code Location:**
- Database: `schema.sql` → CHECK constraints
- Backend: `models/LeaveModel.js` → `recordTransaction()`

---

## Rule 6: Attendance Edit Audit Trail

### The Rule
- **Every edit** to attendance records must be logged
- **Mandatory fields**:
  - Original value
  - New value
  - Reason (admin must provide)
  - Admin username
  - Timestamp

### What Gets Logged
- Status changes (present → absent)
- Clock time modifications
- Late arrival flag changes
- Any manual adjustments

**Implementation:**
- `AttendanceModel.editAttendance()` logs all changes
- Logs stored in `attendance_edits` table
- Multiple edits create multiple log entries
- Logs are immutable (cannot be deleted)

**Code Location:**
- Backend: `models/AttendanceModel.js` → `editAttendance()`
- Database: `attendance_edits` table

---

## Rule 7: Freelancer Session Tracking

### The Rule
- Freelancers have **no leave system**
- Only login/logout tracking
- Each session records:
  - Login timestamp
  - Logout timestamp
  - Auto-calculated duration (read-only)
  - Session date (derived from login)

### Session Rules
- Cannot clock in if already clocked in (prevents duplicates)
- Cannot clock out without clock in
- Incomplete sessions flagged (no logout)
- Duration calculated by database trigger

**Implementation:**
- Trigger calculates duration on logout
- Frontend displays incomplete sessions separately
- No impact on employee attendance/leave data

**Code Location:**
- Backend: `models/FreelancerModel.js`
- Database: Trigger `calculate_session_duration`

---

## Rule 8: Mandatory Notes for Manual Actions

### Actions Requiring Notes
1. CL Redemption
2. CL Encashment
3. CL Carry Forward
4. Leave Credit (adding to balance)
5. Attendance Edits

### Enforcement
- API validates notes are non-empty
- Database stores notes in respective tables
- Notes visible in reports and history

**Implementation:**
```javascript
if (!notes || notes.trim() === '') {
    throw new Error('Notes are mandatory');
}
```

**Code Location:**
- Backend: `services/LeaveService.js`
- Backend: `controllers/LeaveController.js`

---

## Rule 9: Leave Ledger (Transaction-Based)

### The Concept
- All leave changes are **transactions**, not direct updates
- Each transaction records:
  - Type (debit, credit, encash, carryforward, conversion)
  - Amount
  - Balance after transaction
  - Notes
  - Admin user
  - Timestamp

### Transaction Types
- **debit**: Using leave (CL or PL)
- **credit**: Adding to balance
- **encash**: Converting CL to money
- **carryforward**: Rolling over
- **conversion**: CL → PL (consecutive rule)

### Benefits
- Complete audit trail
- Can reconstruct balance at any point in time
- Clear accountability (admin name on each action)

**Implementation:**
- `LeaveModel.recordTransaction()` handles all types
- Atomic operations (transaction + balance update)
- Rollback on any error

**Code Location:**
- Backend: `models/LeaveModel.js`
- Database: `leave_ledger` table

---

## Rule 10: Salary is Manual Entry Only

### The Rule
- **NO salary calculations** in the system
- Salary field is for **display only**
- Admins enter salary manually
- No auto-generation of salary slips
- No payroll processing

### What IS Tracked
- Attendance (present/absent)
- Leave usage
- Work hours (for freelancers)

### What IS NOT Tracked
- Salary computation
- Deductions
- Bonuses
- Payment processing

**Implementation:**
- Salary field in database is nullable
- No business logic touches salary field
- No salary-related calculations anywhere

**Code Location:**
- Backend: `models/EmployeeModel.js` (salary is just stored, not calculated)
- Database: `employees.salary` field (manual entry)

---

## System-Wide Validations

### Server-Side Validations
✅ Employee code uniqueness
✅ Required fields presence
✅ Data type validation
✅ Date format validation
✅ Balance sufficiency
✅ Notes requirement

### Database Constraints
✅ Foreign keys with CASCADE/RESTRICT
✅ CHECK constraints on balances
✅ UNIQUE constraints where needed
✅ NOT NULL on critical fields
✅ Proper indexing

### Business Logic Validations
✅ Consecutive CL detection
✅ Clocking schedule requirement
✅ Duplicate clock-in prevention
✅ Off-day logic
✅ Leave balance checks

---

## Edge Cases Handled

### 1. No Logout Recorded
- Session marked as "incomplete"
- Visible in incomplete sessions report
- Admin can manually close session

### 2. Duplicate Clock-In
- System blocks with error message
- Prevents duplicate attendance records
- User must clock out first

### 3. Attendance on Off Day
- Only that employee marked present
- No bulk changes
- No leave impacts

### 4. Editing Historical Attendance
- Allowed with proper notes
- Fully logged with reason
- Admin accountability maintained

### 5. Negative Balance Attempts
- Blocked at database level
- API rejects before database hit
- Clear error message to user

### 6. Missing Notes on Manual Actions
- API validation rejects request
- User forced to provide notes
- Ensures audit trail completeness

---

## Reporting Business Rules

### Employee Summary
- **Working days**: Count of attendance records
- **Present days**: Status = 'present'
- **CL/PL used**: Sum from leave ledger
- **Remaining balance**: Current balance from employee record

### Freelancer Summary
- **Total hours**: Sum of session durations
- **Session value**: Hours × hourly rate (display only, not stored)
- **Incomplete sessions**: Sessions without logout

### Daily Report
- Shows only employees with attendance records for that date
- Unmarked employees listed separately
- Summary totals provided

---

## Important Notes for Administrators

### Do's ✅
- Always provide notes for manual actions
- Review consecutive CL conversions
- Check incomplete sessions regularly
- Export reports for record-keeping
- Verify attendance before month-end

### Don'ts ❌
- Don't mark absent without applying leave
- Don't manually edit leave balances (use credit/debit)
- Don't delete attendance records (use edit with notes)
- Don't ignore incomplete sessions
- Don't bulk-update without understanding impact

---

## Compliance & Audit

### Audit Trail Components
1. **Attendance Edits Table**: All manual changes
2. **Leave Ledger**: All leave transactions
3. **Admin Actions**: Username on every manual operation
4. **Timestamps**: All records have created_at

### Reports for Compliance
- Leave usage by employee
- Late arrival patterns
- Attendance edit history
- Leave balance changes over time

---

## Questions & Clarifications

**Q: Can CL be used on non-consecutive days?**
A: Yes, CL can be used freely on non-consecutive days.

**Q: What happens if I try to apply more leave than balance?**
A: System rejects with error "Insufficient balance".

**Q: Can I edit old attendance records?**
A: Yes, but requires notes and is fully logged.

**Q: What if employee clocks in very late?**
A: They're marked present but flagged as late.

**Q: Can freelancers have leave balances?**
A: No, freelancers only have session tracking, no leave system.

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Active
