# Accunite Attendance System - Setup Guide

This guide will walk you through setting up the Accunite Attendance Management System from scratch.

## Prerequisites

Before starting, ensure you have:

1. **Node.js** (v16.x or higher)
   ```bash
   node --version  # Should show v16.0.0 or higher
   ```

2. **MySQL** (v8.0 or higher)
   ```bash
   mysql --version  # Should show 8.0 or higher
   ```

3. **npm** (usually comes with Node.js)
   ```bash
   npm --version
   ```

## Step 1: Extract the Project

```bash
# Extract the ZIP file
unzip accunite-attendance-system.zip

# Navigate to the project directory
cd accunite-attendance-system
```

## Step 2: Database Setup

### Option A: Using MySQL Command Line

```bash
# 1. Login to MySQL
mysql -u root -p
# Enter your MySQL root password when prompted

# 2. Create the database
CREATE DATABASE accunite_attendance;

# 3. Use the database
USE accunite_attendance;

# 4. Import the schema
source database/schema.sql;
# OR if you're not in the project directory:
# source /path/to/accunite-attendance-system/database/schema.sql;

# 5. Verify tables were created
SHOW TABLES;

# 6. Exit MySQL
exit;
```

### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Go to **File → Open SQL Script**
4. Select `database/schema.sql`
5. Click the lightning bolt icon to execute
6. Verify tables were created in the left panel

## Step 3: Backend Configuration

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

### Configure .env File

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=accunite_attendance

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration (generate a secure secret key)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
```

**Important**: Replace `YOUR_MYSQL_PASSWORD_HERE` with your actual MySQL password.

### Test Backend Connection

```bash
# Start the backend server
npm run dev

# You should see:
# ✅ Database connected successfully
# 🚀 Server running on port 5000
```

If you see errors:
- **Database connection failed**: Check your MySQL credentials in .env
- **Port already in use**: Change PORT in .env or kill the process using that port

## Step 4: Frontend Configuration

Open a new terminal (keep backend running):

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend server
npm start
```

The application should automatically open in your browser at `http://localhost:3000`

## Step 5: First Login

1. Navigate to `http://localhost:3000` in your browser
2. Use the default credentials:
   ```
   Username: admin
   Password: admin123
   ```
3. You should be redirected to the Dashboard

**⚠️ Security Note**: Change the default password after first login by updating the admin record in the database.

## Step 6: Verify Installation

### Test Basic Functionality

1. **Dashboard**: Should show statistics (may be 0 initially)
2. **Employees**: Try adding a test employee
3. **Attendance**: Try clocking in the test employee
4. **Reports**: Generate a daily report

### Sample Test Data

The database schema includes sample data:
- 3 sample employees (EMP001, EMP002, EMP003)
- 1 sample freelancer (Alice Freelancer)

You can use these to test the system before adding real data.

## Common Issues & Solutions

### Issue: "Cannot connect to MySQL"

**Solution:**
```bash
# Check if MySQL is running
sudo systemctl status mysql
# or on macOS:
brew services list | grep mysql

# Start MySQL if not running
sudo systemctl start mysql
# or on macOS:
brew services start mysql
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Option 1: Kill the process
lsof -ti:5000 | xargs kill -9

# Option 2: Use a different port
# Edit backend/.env and change PORT=5001
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Frontend shows "Network Error"

**Solution:**
1. Ensure backend is running on port 5000
2. Check `frontend/package.json` has `"proxy": "http://localhost:5000"`
3. Clear browser cache and reload

## Production Deployment

For production deployment, additional steps are needed:

### Backend Production

```bash
cd backend

# Set production environment
export NODE_ENV=production

# Use a process manager like PM2
npm install -g pm2
pm2 start src/server.js --name "accunite-api"

# Set up reverse proxy (nginx recommended)
```

### Frontend Production

```bash
cd frontend

# Build production files
npm run build

# Serve the build folder using nginx or similar
```

### Security Recommendations

1. **Change default admin password**
2. **Use strong JWT secret** (generate using `openssl rand -hex 64`)
3. **Enable HTTPS** in production
4. **Set up firewall rules**
5. **Regular database backups**
6. **Use environment-specific .env files**

## Database Backup

### Create Backup

```bash
mysqldump -u root -p accunite_attendance > backup_$(date +%Y%m%d).sql
```

### Restore Backup

```bash
mysql -u root -p accunite_attendance < backup_20260112.sql
```

## Updating the System

When updating the system:

1. **Backup database** first
2. **Pull new code** or extract new ZIP
3. **Check for schema changes** in `database/schema.sql`
4. **Update dependencies**: `npm install` in both backend and frontend
5. **Restart servers**

## Testing the System

### Manual Testing Checklist

- [ ] Can login with admin credentials
- [ ] Can create new employee (clocking type)
- [ ] Can create new employee (non-clocking type)
- [ ] Can clock in clocking employee
- [ ] Can clock out clocking employee
- [ ] Can manually mark non-clocking employee present
- [ ] Can apply CL leave
- [ ] Can apply consecutive CL (should auto-convert to PL)
- [ ] Can view employee summary report
- [ ] Can add freelancer
- [ ] Freelancer can clock in/out
- [ ] Can view freelancer sessions

## Getting Help

### Check Logs

**Backend logs:**
```bash
# Console shows real-time logs
# Check for error messages in terminal
```

**Database logs:**
```bash
# MySQL error log location varies by system
# Common locations:
# - /var/log/mysql/error.log
# - /usr/local/mysql/data/*.err
```

### Debug Mode

Enable detailed logging:

```javascript
// In backend/src/server.js, add:
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});
```

## Next Steps

After successful setup:

1. **Review business rules** in README.md
2. **Add real employees** and configure their details
3. **Set up daily attendance routine**
4. **Configure leave policies** according to your organization
5. **Export reports regularly** for record-keeping

## Support

For technical issues:
1. Check error messages in browser console (F12)
2. Check backend console for API errors
3. Review MySQL logs for database errors
4. Verify all environment variables are set correctly

---

**Setup Complete!** 🎉

You should now have a fully functional attendance management system running locally.
