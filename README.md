# Accunite Attendance Management System

A comprehensive attendance tracking system for employees and freelancers with advanced leave management, business rules, and reporting capabilities.

## 🎯 Key Features

### Employee Management
- Support for both **Clocking** and **Non-Clocking** employees
- Manual salary entry (no auto-calculation)
- Comprehensive employee profiles with leave balances

### Attendance Tracking
- **Clocking Employees**: Automatic clock-in/clock-out with late arrival detection
- **Non-Clocking Employees**: Manual attendance marking by admin
- **Critical Business Rule**: Off-day login affects only that specific employee
- Attendance edit history with full audit trail

### Leave Management (CL & PL)
- **Casual Leave (CL)**: Cannot be used consecutively (auto-converts to PL)
- **Paid Leave (PL)**: Can be used freely
- CL can be encashed or carried forward with mandatory notes
- Complete leave ledger with transaction history

### Freelancer Management
- Session-based tracking (login/logout)
- Auto-calculated session duration
- Hourly rate tracking (no salary calculation)
- Incomplete session alerts

### Reports & Summaries
- Employee attendance summary with leave usage
- Daily attendance reports
- Late arrival reports
- Leave usage reports
- Freelancer session summaries

## 📋 System Requirements

- Node.js 16.x or higher
- MySQL 8.0 or higher
- npm or yarn

## 🚀 Quick Start

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Import the schema
mysql -u root -p < database/schema.sql

# Or manually create database and import
CREATE DATABASE accunite_attendance;
USE accunite_attendance;
source database/schema.sql;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=accunite_attendance

# Start the server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Default Login Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT: Change these credentials after first login!**

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:code` - Update employee
- `DELETE /api/employees/:code` - Delete employee (soft)

### Attendance
- `POST /api/attendance/clock-in` - Clock in (clocking employees)
- `POST /api/attendance/clock-out` - Clock out (clocking employees)
- `POST /api/attendance/mark` - Manual marking (non-clocking employees)
- `GET /api/attendance/date/:date` - Get attendance for date

### Leaves
- `POST /api/leaves/apply` - Apply leave (handles consecutive CL conversion)
- `POST /api/leaves/encash-cl` - Encash CL (requires notes)
- `POST /api/leaves/carryforward-cl` - Carry forward CL
- `GET /api/leaves/:code/balances` - Get leave balances

### Freelancers
- `GET /api/freelancers` - Get all freelancers
- `POST /api/freelancers/:id/clock-in` - Clock in
- `POST /api/freelancers/:id/clock-out` - Clock out
- `GET /api/freelancers/:id/sessions` - Get work sessions

### Reports
- `GET /api/reports/employees` - All employees summary
- `GET /api/reports/employees/:code` - Single employee summary
- `GET /api/reports/daily/:date` - Daily attendance report
- `GET /api/reports/late-arrivals` - Late arrivals report

## 🎨 Frontend Pages

1. **Dashboard**: Overview with quick stats and actions
2. **Employees**: Manage employee profiles and data
3. **Freelancers**: Manage freelancers and track sessions
4. **Attendance**: Clock-in/out and manual attendance marking
5. **Leaves**: Apply leaves, encash CL, view history
6. **Reports**: Generate various attendance and leave reports

## 🔒 Business Rules Implementation

### Rule 1: Clocking vs Non-Clocking
- Clocking employees MUST clock in/out
- Non-clocking employees require manual marking
- Absence without CL is NOT allowed for non-clocking employees

### Rule 2: Off-Day Login
- When an employee logs in on an off day, ONLY that employee is marked present
- Other employees remain absent
- No leave deduction for other employees

### Rule 3: Consecutive CL
- CL cannot be used on consecutive days
- System automatically converts consecutive CL to PL
- User is notified of the conversion

### Rule 4: CL Management
- CL can be encashed (requires mandatory notes)
- CL can be carried forward
- All manual actions require notes for audit trail

### Rule 5: Leave Balance Validation
- Balances cannot go negative
- Database-level constraints enforce this
- API validates before processing

## 📁 Project Structure

```
accunite-attendance-system/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── services/       # API client
│   │   ├── styles/         # CSS styles
│   │   ├── App.js          # Main component
│   │   └── index.js        # Entry point
│   └── package.json
├── database/
│   └── schema.sql          # Database schema
└── README.md
```

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express
- MySQL2 (with promise wrapper)
- JWT for authentication
- bcryptjs for password hashing
- moment for date handling

**Frontend:**
- React 18
- React Router DOM
- Axios for API calls
- CSS3 for styling

## 📝 Important Notes

### What This System Does:
✅ Tracks employee attendance (clocking and non-clocking)
✅ Manages CL/PL with business rules
✅ Tracks freelancer work sessions
✅ Generates comprehensive reports
✅ Maintains complete audit trail

### What This System Does NOT Do:
❌ Salary calculations (salary is manual entry only)
❌ Payroll processing
❌ Payment integrations
❌ Automated salary generation

### Key Business Logic:
- **Consecutive CL Rule**: Automatically converts to PL
- **Off-Day Rule**: Only the logging-in employee is marked present
- **Mandatory Notes**: All manual CL actions require notes
- **Audit Trail**: All edits are logged with reason and admin info

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials in backend/.env
# Check database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Backend Port Already in Use
```bash
# Change PORT in backend/.env
# Or kill existing process
lsof -ti:5000 | xargs kill -9
```

### Frontend Can't Connect to Backend
```bash
# Ensure backend is running on port 5000
# Check proxy in frontend/package.json
# Clear browser cache
```

## 📧 Support

For issues or questions:
1. Check the database schema comments
2. Review the business rules in code comments
3. Check API endpoint documentation above

## 🎓 Database Schema Highlights

- **Relational design** with proper foreign keys
- **Triggers** for auto-calculating session duration
- **Views** for common reports
- **Constraints** to enforce business rules
- **Indexes** for query optimization
- **Audit tables** for tracking changes

## 🔄 Future Enhancements (Not Implemented)

- Email notifications
- Mobile app
- Biometric integration
- Advanced analytics
- Department-based permissions
- Shift scheduling

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Created for:** Accunite
