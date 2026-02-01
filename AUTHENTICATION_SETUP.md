# Authentication System Setup Guide

## Overview
The system now supports two types of users:
1. **Admin**: Can manage everything, assign credentials to employees
2. **Employee**: Can only clock in/out themselves, view attendance (read-only)

## Database Migration Required

Run this SQL to add password_hash column:
```sql
USE accunite_attendance;
ALTER TABLE employees ADD COLUMN password_hash VARCHAR(255) NULL COMMENT 'Hashed password for employee login' AFTER email;
```

## Backend Changes Made

1. ✅ Added `password_hash` to employees table schema
2. ✅ Created employee login endpoint (`/api/auth/employee-login`)
3. ✅ Updated auth middleware to handle both admin and employee tokens
4. ✅ Added credential assignment endpoint (`/api/employees/:code/assign-credentials`)
5. ✅ Updated attendance routes to check permissions (employee can only clock themselves)

## Frontend Changes Made

1. ✅ Updated API service to handle authentication tokens
2. ✅ Created login page with admin/employee tabs
3. ⏳ Need to update App.js for authentication routing
4. ⏳ Need to add credential assignment UI in Employees page
5. ⏳ Need to create employee-specific views

## Next Steps

1. Run database migration
2. Update App.js to handle authentication
3. Add "Assign Credentials" button in Employees page
4. Test the system

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/employee-login` - Employee login
- `GET /api/auth/verify` - Verify token

### Employee Management
- `POST /api/employees/:employeeCode/assign-credentials` - Assign email/password (Admin only)

## Usage

### Admin Flow
1. Login as admin (username: admin, password: admin123)
2. Go to Employees page
3. Click "Assign Credentials" for each employee
4. Enter email and password
5. Employee can now login with those credentials

### Employee Flow
1. Employee logs in with email and password (assigned by admin)
2. Can only clock in/out themselves
3. Can view all employees' attendance (read-only)
4. Cannot make changes to other employees
