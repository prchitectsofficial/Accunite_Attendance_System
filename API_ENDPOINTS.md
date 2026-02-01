# API Endpoints Documentation

Base URL: `http://localhost:5000/api`

All endpoints except `/auth/login` require JWT authentication via `Authorization: Bearer <token>` header.

## Authentication

### Login
```
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "jwt_token", "user": { ...userData } }
```

### Verify Token
```
GET /api/auth/verify
Headers: Authorization: Bearer <token>
Response: { "valid": true, "user": { ...userData } }
```

## Employees

### Get All Employees
```
GET /api/employees
Response: { "success": true, "count": 3, "data": [...employees] }
```

### Get Employee by Code
```
GET /api/employees/:employeeCode
Response: { "success": true, "data": { ...employee } }
```

### Get Employees by Type
```
GET /api/employees/type/:type
Params: type = 'clocking' | 'non-clocking'
Response: { "success": true, "count": 2, "data": [...employees] }
```

### Create Employee
```
POST /api/employees
Body: {
  "employee_code": "EMP004",
  "name": "John Doe",
  "salary": 50000,
  "attendance_type": "clocking",
  "clock_start_time": "09:00",
  "clock_end_time": "18:00",
  "cl_balance": 12,
  "pl_balance": 15
}
Response: { "success": true, "message": "Employee created successfully", "data": { ...employee } }
```

### Update Employee
```
PUT /api/employees/:employeeCode
Body: { "name": "Updated Name", "salary": 55000 }
Response: { "success": true, "message": "Employee updated successfully", "data": { ...employee } }
```

### Delete Employee
```
DELETE /api/employees/:employeeCode
Response: { "success": true, "message": "Employee deleted successfully" }
```

## Freelancers

### Get All Freelancers
```
GET /api/freelancers
Response: { "success": true, "count": 1, "data": [...freelancers] }
```

### Get Freelancer by ID
```
GET /api/freelancers/:freelancerId
Response: { "success": true, "data": { ...freelancer } }
```

### Create Freelancer
```
POST /api/freelancers
Body: { "name": "Alice", "hourly_rate": 25.00 }
Response: { "success": true, "message": "Freelancer created successfully", "data": { ...freelancer } }
```

### Clock In
```
POST /api/freelancers/:freelancerId/clock-in
Response: { "success": true, "message": "Clocked in successfully", "data": { ...session } }
```

### Clock Out
```
POST /api/freelancers/:freelancerId/clock-out
Response: { "success": true, "message": "Clocked out successfully", "data": { ...session } }
```

### Get Sessions
```
GET /api/freelancers/:freelancerId/sessions?start_date=2026-01-01&end_date=2026-01-31
Response: { "success": true, "count": 5, "data": [...sessions] }
```

### Get Incomplete Sessions
```
GET /api/freelancers/incomplete-sessions
Response: { "success": true, "count": 2, "data": [...incompleteSessions] }
```

## Attendance

### Clock In (Clocking Employees)
```
POST /api/attendance/clock-in
Body: { "employee_code": "EMP001" }
Query: ?is_off_day=true (optional)
Response: { "success": true, "message": "Clocked in successfully", "data": { ...attendance } }
```

### Clock Out (Clocking Employees)
```
POST /api/attendance/clock-out
Body: { "employee_code": "EMP001" }
Response: { "success": true, "message": "Clocked out successfully", "data": { ...attendance } }
```

### Mark Attendance (Non-Clocking Employees)
```
POST /api/attendance/mark
Body: {
  "employee_code": "EMP002",
  "date": "2026-01-12",
  "status": "present",
  "notes": "Manually marked"
}
Response: { "success": true, "message": "Attendance marked successfully", "data": { ...attendance } }
```

### Get Attendance by Date
```
GET /api/attendance/:employeeCode/:date
Response: { "success": true, "data": { ...attendance } }
```

### Get Attendance Range
```
GET /api/attendance/:employeeCode/range?start_date=2026-01-01&end_date=2026-01-31
Response: { "success": true, "count": 20, "data": [...attendanceRecords] }
```

### Get All Attendance for Date
```
GET /api/attendance/date/:date
Response: { "success": true, "count": 3, "data": [...attendanceRecords] }
```

### Edit Attendance
```
PUT /api/attendance/:recordId
Body: {
  "updates": { "status": "present", "notes": "Corrected" },
  "reason": "Employee forgot to clock in"
}
Response: { "success": true, "message": "Attendance edited successfully", "data": { ...attendance } }
```

### Get Edit History
```
GET /api/attendance/:recordId/history
Response: { "success": true, "count": 2, "data": [...editHistory] }
```

## Leaves

### Apply Leave (Single Day)
```
POST /api/leaves/apply
Body: {
  "employee_code": "EMP001",
  "date": "2026-01-15",
  "leave_type": "cl",
  "notes": "Doctor appointment"
}
Response: {
  "success": true,
  "applied_leave_type": "cl",
  "was_converted": false,
  "message": "Leave applied successfully."
}
```

### Apply Multiple Days
```
POST /api/leaves/apply-multiple
Body: {
  "employee_code": "EMP001",
  "start_date": "2026-01-15",
  "end_date": "2026-01-17",
  "leave_type": "cl",
  "notes": "Vacation"
}
Response: {
  "success": true,
  "message": "Leave application processed",
  "results": [...]
}
```

### Redeem CL
```
POST /api/leaves/redeem-cl
Body: {
  "employee_code": "EMP001",
  "amount": 2,
  "notes": "Manual redemption for..."
}
Response: { "success": true, "message": "CL redeemed successfully", "data": { ...transaction } }
```

### Encash CL
```
POST /api/leaves/encash-cl
Body: {
  "employee_code": "EMP001",
  "amount": 5,
  "notes": "Year-end encashment"
}
Response: { "success": true, "message": "CL encashed successfully", "data": { ...transaction } }
```

### Carry Forward CL
```
POST /api/leaves/carryforward-cl
Body: {
  "employee_code": "EMP001",
  "notes": "Carry forward to next year"
}
Response: { "success": true, "message": "CL carried forward successfully", "data": { ...transaction } }
```

### Credit Leave
```
POST /api/leaves/credit
Body: {
  "employee_code": "EMP001",
  "leave_type": "cl",
  "amount": 3,
  "notes": "Annual leave credit"
}
Response: { "success": true, "message": "Leave credited successfully", "data": { ...transaction } }
```

### Get Leave History
```
GET /api/leaves/:employeeCode/history?start_date=2026-01-01&end_date=2026-01-31
Response: { "success": true, "count": 5, "data": [...leaveHistory] }
```

### Get Balances
```
GET /api/leaves/:employeeCode/balances
Response: {
  "success": true,
  "data": { "cl_balance": 10, "pl_balance": 12 }
}
```

### Get Leave Summary
```
GET /api/leaves/:employeeCode/summary?start_date=2026-01-01&end_date=2026-01-31
Response: {
  "success": true,
  "data": {
    "current_balances": { "cl_balance": 10, "pl_balance": 12 },
    "period_summary": [...]
  }
}
```

## Reports

### Get All Employees Summary
```
GET /api/reports/employees?start_date=2026-01-01&end_date=2026-01-31
Response: {
  "success": true,
  "data": {
    "summaries": [...employeeSummaries],
    "period": { "start_date": "...", "end_date": "..." }
  }
}
```

### Get Employee Summary
```
GET /api/reports/employees/:employeeCode?start_date=2026-01-01&end_date=2026-01-31
Response: {
  "success": true,
  "data": {
    "employee_code": "EMP001",
    "name": "John Doe",
    "days_present": 20,
    "cl_used": 2,
    "pl_used": 1,
    "cl_balance": 10,
    "pl_balance": 14,
    ...
  }
}
```

### Get Daily Report
```
GET /api/reports/daily/:date
Response: {
  "success": true,
  "data": {
    "date": "2026-01-12",
    "marked_attendance": [...],
    "unmarked_employees": [...],
    "summary": {
      "total_employees": 3,
      "marked": 2,
      "unmarked": 1,
      "present": 2,
      "on_leave": 0
    }
  }
}
```

### Get Freelancer Summary
```
GET /api/reports/freelancers/:freelancerId?start_date=2026-01-01&end_date=2026-01-31
Response: {
  "success": true,
  "data": {
    "freelancer_id": 1,
    "name": "Alice",
    "sessions": [...],
    "summary": {
      "total_sessions": 10,
      "complete_sessions": 9,
      "incomplete_sessions": 1,
      "total_hours": "80.50",
      "total_value": "2012.50"
    }
  }
}
```

### Get Incomplete Sessions Report
```
GET /api/reports/incomplete-sessions
Response: { "success": true, "count": 1, "data": [...incompleteSessions] }
```

### Get Late Arrivals Report
```
GET /api/reports/late-arrivals?start_date=2026-01-01&end_date=2026-01-31
Response: {
  "success": true,
  "data": {
    "period": { "start_date": "...", "end_date": "..." },
    "late_arrivals": [...],
    "total_count": 5
  }
}
```

### Get Leave Usage Report
```
GET /api/reports/leave-usage?start_date=2026-01-01&end_date=2026-01-31
Response: {
  "success": true,
  "data": {
    "period": { "start_date": "...", "end_date": "..." },
    "employees": [...]
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error
