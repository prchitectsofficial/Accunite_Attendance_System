import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    employeeLogin: (email, password) => api.post('/auth/employee-login', { email, password }),
    freelancerLogin: (email, password) => api.post('/auth/freelancer-login', { email, password }),
    verify: () => api.get('/auth/verify')
};

// Employee API
export const employeeAPI = {
    getAll: () => api.get('/employees'),
    getById: (code) => api.get(`/employees/${code}`),
    create: (data) => api.post('/employees', data),
    update: (code, data) => api.put(`/employees/${code}`, data),
    delete: (code) => api.delete(`/employees/${code}`),
    getByType: (type) => api.get(`/employees/type/${type}`),
    assignCredentials: (code, email, password) => {
        const body = { email };
        if (password) {
            body.password = password;
        }
        return api.post(`/employees/${code}/assign-credentials`, body);
    },
    getSalarySlip: (code, year, month) => api.get(`/employees/${code}/salary-slip`, { params: { year, month } })
};

// Freelancer API
export const freelancerAPI = {
    getAll: () => api.get('/freelancers'),
    getById: (id) => api.get(`/freelancers/${id}`),
    create: (data) => api.post('/freelancers', data),
    update: (id, data) => api.put(`/freelancers/${id}`, data),
    delete: (id) => api.delete(`/freelancers/${id}`),
    clockIn: (id) => api.post(`/freelancers/${id}/clock-in`),
    clockOut: (id, workSummary) => api.post(`/freelancers/${id}/clock-out`, { work_summary: workSummary }),
    getSessions: (id, startDate, endDate) => 
        api.get(`/freelancers/${id}/sessions`, { params: { start_date: startDate, end_date: endDate } }),
    assignCredentials: (freelancerId, email, password) => 
        api.post(`/freelancers/${freelancerId}/assign-credentials`, { email, password })
};

// Attendance API
export const attendanceAPI = {
    clockIn: (employeeCode, isOffDay = false) => 
        api.post('/attendance/clock-in', { employee_code: employeeCode }, { params: { is_off_day: isOffDay } }),
    clockOut: (employeeCode) => api.post('/attendance/clock-out', { employee_code: employeeCode }),
    breakStart: (employeeCode) => api.post('/attendance/break-start', { employee_code: employeeCode }),
    breakStop: (employeeCode) => api.post('/attendance/break-stop', { employee_code: employeeCode }),
    markAttendance: (employeeCode, date, status, notes) => 
        api.post('/attendance/mark', { employee_code: employeeCode, date, status, notes }),
    getByDate: (employeeCode, date) => api.get(`/attendance/${employeeCode}/${date}`),
    getRange: (employeeCode, startDate, endDate) => 
        api.get(`/attendance/${employeeCode}/range`, { params: { start_date: startDate, end_date: endDate } }),
    getAllByDate: (date) => api.get(`/attendance/date/${date}`),
    edit: (recordId, updates, reason) => api.put(`/attendance/${recordId}`, { updates, reason }),
    getEditHistory: (recordId) => api.get(`/attendance/${recordId}/history`)
};

// Leave API
export const leaveAPI = {
    apply: (employeeCode, date, leaveType, notes, reason) => 
        api.post('/leaves/apply', { employee_code: employeeCode, date, leave_type: leaveType, notes, reason }),
    applyMultiple: (employeeCode, startDate, endDate, leaveType, notes) => 
        api.post('/leaves/apply-multiple', { employee_code: employeeCode, start_date: startDate, end_date: endDate, leave_type: leaveType, notes }),
    redeemCL: (employeeCode, amount, notes) => 
        api.post('/leaves/redeem-cl', { employee_code: employeeCode, amount, notes }),
    encashCL: (employeeCode, amount, notes) => 
        api.post('/leaves/encash-cl', { employee_code: employeeCode, amount, notes }),
    carryForwardCL: (employeeCode, notes) => 
        api.post('/leaves/carryforward-cl', { employee_code: employeeCode, notes }),
    credit: (employeeCode, leaveType, amount, notes) => 
        api.post('/leaves/credit', { employee_code: employeeCode, leave_type: leaveType, amount, notes }),
    getHistory: (employeeCode, startDate, endDate) => 
        api.get(`/leaves/${employeeCode}/history`, { params: { start_date: startDate, end_date: endDate } }),
    getBalances: (employeeCode) => api.get(`/leaves/${employeeCode}/balances`),
    getSummary: (employeeCode, startDate, endDate) => 
        api.get(`/leaves/${employeeCode}/summary`, { params: { start_date: startDate, end_date: endDate } })
};

// Report API
export const reportAPI = {
    getEmployeeSummary: (employeeCode, startDate, endDate) => 
        api.get(`/reports/employees/${employeeCode}`, { params: { start_date: startDate, end_date: endDate } }),
    getAllEmployeesSummary: (startDate, endDate) => 
        api.get('/reports/employees', { params: { start_date: startDate, end_date: endDate } }),
    getDailyReport: (date) => api.get(`/reports/daily/${date}`),
    getFreelancerSummary: (freelancerId, startDate, endDate) => 
        api.get(`/reports/freelancers/${freelancerId}`, { params: { start_date: startDate, end_date: endDate } }),
    getIncompleteSessions: () => api.get('/reports/incomplete-sessions'),
    getLateArrivals: (startDate, endDate) => 
        api.get('/reports/late-arrivals', { params: { start_date: startDate, end_date: endDate } }),
    getLeaveUsage: (startDate, endDate) => 
        api.get('/reports/leave-usage', { params: { start_date: startDate, end_date: endDate } })
};

export default api;