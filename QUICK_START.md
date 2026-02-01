# Quick Start Guide - Accunite Attendance System

## Prerequisites
- Node.js (v16 or higher) installed
- MySQL (v8.0 or higher) installed and running
- npm (comes with Node.js)

## Step 1: Database Setup

### Option A: Using MySQL Command Line
```bash
# Login to MySQL
mysql -u root -p

# Create database and import schema
mysql -u root -p < database/schema.sql
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Go to **File → Open SQL Script**
4. Select `database/schema.sql`
5. Click the lightning bolt icon (⚡) to execute

### Add Missing Columns (if needed)
If your database was created before recent updates, run these in MySQL:
```sql
USE accunite_attendance;

-- Add email column
ALTER TABLE employees ADD COLUMN email VARCHAR(255) NULL COMMENT 'Employee email address' AFTER name;

-- Add clock_start_time column
ALTER TABLE employees ADD COLUMN clock_start_time TIME NULL COMMENT 'Optional - can be set later if needed' AFTER attendance_type;

-- Add clock_end_time column
ALTER TABLE employees ADD COLUMN clock_end_time TIME NULL COMMENT 'Optional - can be set later if needed' AFTER clock_start_time;

-- Add grace_period_minutes column
ALTER TABLE employees ADD COLUMN grace_period_minutes INT DEFAULT 15 COMMENT 'Late arrival tolerance' AFTER clock_end_time;
```

## Step 2: Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create .env file
Create a file named `.env` in the `backend` directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=accunite_attendance

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
```

**Important:** Replace `your_mysql_password_here` with your actual MySQL root password.

### 4. Start the backend server
```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📝 API Base URL: http://localhost:5000/api
```

**Keep this terminal open!** The backend must be running.

## Step 3: Frontend Setup

### 1. Open a NEW terminal window
(Keep the backend terminal running)

### 2. Navigate to frontend directory
```bash
cd frontend
```

### 3. Install dependencies
```bash
npm install
```

### 4. Start the frontend server
```bash
npm start
```

The application should automatically open in your browser at `http://localhost:3000`

If it doesn't open automatically, manually navigate to: **http://localhost:3000**

## Step 4: Using the Application

1. The app will open at `http://localhost:3000`
2. You'll be redirected to the Dashboard
3. Navigate to **Employees** to add/manage employees
4. Use **Attendance** to mark attendance
5. Use **Leaves** to manage leave applications
6. Use **Reports** to view various reports

## Troubleshooting

### Backend won't start
- **Database connection failed**: 
  - Check MySQL is running: `mysql -u root -p`
  - Verify credentials in `backend/.env`
  - Make sure database `accunite_attendance` exists

- **Port 5000 already in use**:
  - Change `PORT=5001` in `backend/.env`
  - Or kill the process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)
  - Or use Task Manager to end the process (Windows)

### Frontend won't start
- **Port 3000 already in use**:
  - The terminal will ask if you want to use a different port (type `Y`)
  - Or kill the process using port 3000

- **Can't connect to backend**:
  - Make sure backend is running on port 5000
  - Check `frontend/package.json` has `"proxy": "http://localhost:5000"`
  - Clear browser cache and reload

### Database errors
- **"Unknown column" errors**:
  - Run the migration SQL commands shown in Step 1
  - Or recreate the database using the updated `database/schema.sql`

## Running Both Servers

You need **TWO terminal windows**:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

## Stopping the Application

- **Backend**: Press `Ctrl + C` in the backend terminal
- **Frontend**: Press `Ctrl + C` in the frontend terminal

## Default Credentials

The system has authentication bypassed in development mode, so you can access directly without login.

---

**That's it! Your application should now be running! 🎉**
