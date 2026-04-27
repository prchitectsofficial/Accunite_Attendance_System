import React, { useState, useEffect } from 'react';
import { employeeAPI, attendanceAPI } from '../services/api';

// Helper function to get current date in local timezone (browser's timezone)
const getLocalDate = () => {
    const now = new Date();
    // Get local date string in YYYY-MM-DD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function AttendancePage() {
    const [employees, setEmployees] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get logged-in user from localStorage
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        setCurrentUser(user);
    }, []);

    useEffect(() => {
        loadEmployees();
        loadAttendance();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            loadAttendance();
        }
    }, [selectedDate]);

    const loadEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            console.log('Employees loaded:', response.data.data);
            setEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error loading employees:', error);
            showMessage('error', 'Failed to load employees');
        }
    };

    const loadAttendance = async () => {
        try {
            console.log('Loading attendance for date:', selectedDate);
            const response = await attendanceAPI.getAllByDate(selectedDate);
            console.log('Attendance API response:', response.data);
            if (response.data && response.data.data) {
                const records = response.data.data;
                console.log('Setting attendance records:', records);
                setAttendanceRecords(records);
            } else {
                console.warn('Unexpected response structure:', response.data);
                // Fallback to employees if no attendance records
                if (employees.length > 0) {
                    const fallbackRecords = employees.map(emp => ({
                        employee_code: emp.employee_code,
                        employee_name: emp.name,
                        attendance_type: emp.attendance_type,
                        status: null,
                        clock_in_time: null,
                        clock_out_time: null
                    }));
                    setAttendanceRecords(fallbackRecords);
                } else {
                    setAttendanceRecords([]);
                }
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
            // If API fails, still show employees from the employees list
            if (employees.length > 0) {
                const fallbackRecords = employees.map(emp => ({
                    employee_code: emp.employee_code,
                    employee_name: emp.name,
                    attendance_type: emp.attendance_type,
                    status: null,
                    clock_in_time: null,
                    clock_out_time: null
                }));
                setAttendanceRecords(fallbackRecords);
            } else {
                setAttendanceRecords([]);
            }
        }
    };

    const handleClockIn = async (employeeCode) => {
        setLoading(true);
        try {
            const response = await attendanceAPI.clockIn(employeeCode);
            console.log('Clock in response:', response.data);
            showMessage('success', 'Clocked in successfully');
            // Reload attendance immediately with a small delay to ensure DB is updated
            setTimeout(async () => {
                await loadAttendance();
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Clock in error:', error);
            showMessage('error', error.response?.data?.message || 'Clock in failed');
            setLoading(false);
        }
    };

    const handleClockOut = async (employeeCode) => {
        // Ask for work summary
        const workSummary = window.prompt('Please enter work summary (required):');
        if (workSummary === null) {
            // User cancelled
            return;
        }
        if (!workSummary || workSummary.trim() === '') {
            showMessage('error', 'Work summary is required');
            return;
        }
        
        setLoading(true);
        try {
            await attendanceAPI.clockOut(employeeCode, workSummary.trim());
            showMessage('success', 'Clocked out successfully');
            // Reload attendance immediately
            await loadAttendance();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Clock out failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBreakStart = async (employeeCode) => {
        setLoading(true);
        try {
            await attendanceAPI.breakStart(employeeCode);
            showMessage('success', 'Break started successfully');
            setTimeout(async () => {
                await loadAttendance();
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Break start error:', error);
            showMessage('error', error.response?.data?.message || 'Break start failed');
            setLoading(false);
        }
    };

    const handleBreakStop = async (employeeCode) => {
        setLoading(true);
        try {
            await attendanceAPI.breakStop(employeeCode);
            showMessage('success', 'Break stopped successfully');
            setTimeout(async () => {
                await loadAttendance();
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Break stop error:', error);
            showMessage('error', error.response?.data?.message || 'Break stop failed');
            setLoading(false);
        }
    };

    const handleMarkPresent = async (employeeCode) => {
        setLoading(true);
        try {
            await attendanceAPI.markAttendance(employeeCode, selectedDate, 'present', null);
            showMessage('success', 'Marked present successfully');
            // Reload attendance to update status
            await loadAttendance();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const getAttendanceStatus = (employeeCode) => {
        const record = attendanceRecords.find(r => r.employee_code === employeeCode);
        if (!record) return 'Not Marked';
        // Handle null status (not marked yet)
        if (record.status === null || record.status === undefined) return 'Not Marked';
        return record.status;
    };

    const getAttendanceRecord = (employeeCode) => {
        return attendanceRecords.find(r => r.employee_code === employeeCode);
    };

    const isClockedIn = (employeeCode) => {
        const record = getAttendanceRecord(employeeCode);
        return record && record.clock_in_time && !record.clock_out_time;
    };

    const isClockedOut = (employeeCode) => {
        const record = getAttendanceRecord(employeeCode);
        return record && record.clock_out_time;
    };

    const isOnBreak = (employeeCode) => {
        const record = getAttendanceRecord(employeeCode);
        return record && record.break_start_time && !record.break_stop_time;
    };

    const formatTime = (datetime) => {
        if (!datetime) return '-';
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return '-';
        // If it's already in YYYY-MM-DD format, return as is
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        // Otherwise, parse and format
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatWorkingHours = (minutes) => {
        if (!minutes && minutes !== 0) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getMaxDate = () => {
        return getLocalDate();
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'present': 'success',
            'absent': 'danger',
            'cl': 'warning',
            'pl': 'info',
            'Not Marked': 'secondary'
        };
        return statusMap[status] || 'secondary';
    };

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.admin_id);
    const canTakeAction = (employeeCode) => {
        // Admin can take action for anyone
        if (isAdmin) return true;
        // Employee can only take action for themselves
        if (currentUser && currentUser.employee_code) {
            return currentUser.employee_code === employeeCode;
        }
        return false;
    };

    const getUserDisplayName = () => {
        if (!currentUser) return 'User';
        if (currentUser.full_name) return currentUser.full_name;
        if (currentUser.name) return currentUser.name;
        if (currentUser.username) return currentUser.username;
        return 'User';
    };

    return (
        <div style={{ maxWidth: '98%', margin: '0 auto', padding: '0 1%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h1 style={{ margin: 0 }}>Attendance Management</h1>
                {currentUser && (
                    <div style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#f0f0f0', 
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        Logged in as: <strong>{getUserDisplayName()}</strong> {isAdmin && <span style={{ color: '#007bff' }}>(Admin)</span>}
                    </div>
                )}
            </div>

            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, marginBottom: '5px' }}>Employee Attendance</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                const selected = e.target.value;
                                const today = getLocalDate(); // Use local date, not UTC
                                if (selected > today) {
                                    showMessage('error', 'Cannot view attendance for future dates');
                                    return;
                                }
                                setSelectedDate(selected);
                            }}
                            max={getMaxDate()}
                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button className="btn btn-primary" style={{ padding: '8px 16px' }}>OK</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Day</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Work Type</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Employee</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Time In</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Time Out</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Break Start</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Break Stop</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Total Working Hrs</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Late Time</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Over Time</th>
                                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>
                                    No employees found. Please add employees first.
                                </td>
                            </tr>
                        ) : (
                            // Use attendanceRecords if available, otherwise fall back to employees
                            (attendanceRecords.length > 0 ? attendanceRecords : employees.map(emp => ({
                                employee_code: emp.employee_code,
                                employee_name: emp.name,
                                name: emp.name,
                                attendance_type: emp.attendance_type,
                                attendance_date: selectedDate,
                                status: null,
                                clock_in_time: null,
                                clock_out_time: null,
                                break_start_time: null,
                                break_stop_time: null,
                                total_working_minutes: null,
                                late_minutes: null,
                                overtime_minutes: null
                            }))).map(record => {
                                const emp = employees.find(e => e.employee_code === record.employee_code) || {};
                                const status = getAttendanceStatus(record.employee_code);
                                const clockedIn = isClockedIn(record.employee_code);
                                const onBreak = isOnBreak(record.employee_code);
                                const attendanceType = record.attendance_type || emp.attendance_type;
                                const date = record.attendance_date || selectedDate;
                                
                                return (
                                    <tr key={record.employee_code} style={{ backgroundColor: '#fff' }}>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {formatDateOnly(date)}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {formatDate(date)}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {attendanceType || '-'}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {record.employee_name || emp.name || record.name}
                                        </td>

<td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
    {record.attendance_type === 'non-clocking' 
        ? (record.status === 'present' ? 'Working' : '-')
        : formatTime(record.clock_in_time)
    }
</td>
<td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
    {record.attendance_type === 'non-clocking' 
        ? '-'
        : formatTime(record.clock_out_time)
    }
</td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>

{formatTime(record.break_start_time)}                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {formatTime(record.break_stop_time)}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {formatWorkingHours(record.total_working_minutes)}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {formatWorkingHours(record.late_minutes)}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {formatWorkingHours(record.overtime_minutes)}
                                        </td>
                                        <td style={{ padding: '8px', border: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>
                                            {canTakeAction(record.employee_code) ? (
                                                <>
                                                    {attendanceType && attendanceType.toLowerCase() === 'non-clocking' ? (
                                                        record.status === 'present' ? (
                                                            <span style={{ 
                                                                color: '#28a745', 
                                                                fontSize: '12px',
                                                                fontWeight: '500',
                                                                padding: '4px 8px',
                                                                backgroundColor: '#d4edda',
                                                                borderRadius: '4px',
                                                                display: 'inline-block'
                                                            }}>
                                                                Marked
                                                            </span>
                                                        ) : (
                                                            <button 
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => handleMarkPresent(record.employee_code)}
                                                                disabled={loading}
                                                                style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2' }}
                                                            >
                                                                Mark Present
                                                            </button>
                                                        )
                                                    ) : attendanceType && attendanceType.toLowerCase() === 'clocking' ? (
                                                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                                            {isClockedOut(record.employee_code) ? (
                                                                <button 
                                                                    className="btn btn-sm btn-success"
                                                                    disabled={true}
                                                                    style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', whiteSpace: 'nowrap', opacity: 0.6, cursor: 'not-allowed' }}
                                                                    title="Already clocked out for today"
                                                                >
                                                                    Clock In
                                                                </button>
                                                            ) : !clockedIn ? (
                                                                <button 
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => handleClockIn(record.employee_code)}
                                                                    disabled={loading}
                                                                    style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', whiteSpace: 'nowrap' }}
                                                                >
                                                                    Clock In
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    {!record.clock_out_time ? (
                                                                        <>
                                                                            {!onBreak ? (
                                                                                <>
                                                                                    <button 
                                                                                        className="btn btn-sm btn-warning"
                                                                                        onClick={() => handleBreakStart(record.employee_code)}
                                                                                        disabled={loading}
                                                                                        style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', whiteSpace: 'nowrap' }}
                                                                                    >
                                                                                        Start Break
                                                                                    </button>
                                                                                    <button 
                                                                                        className="btn btn-sm btn-danger"
                                                                                        onClick={() => handleClockOut(record.employee_code)}
                                                                                        disabled={loading}
                                                                                        style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', whiteSpace: 'nowrap' }}
                                                                                    >
                                                                                        Clock Out
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <button 
                                                                                    className="btn btn-sm btn-info"
                                                                                    onClick={() => handleBreakStop(record.employee_code)}
                                                                                    disabled={loading}
                                                                                    style={{ padding: '4px 8px', fontSize: '11px', lineHeight: '1.2', whiteSpace: 'nowrap' }}
                                                                                >
                                                                                    End Break
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span style={{ 
                                                                            color: '#28a745', 
                                                                            fontSize: '12px',
                                                                            fontWeight: '500',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#d4edda',
                                                                            borderRadius: '4px',
                                                                            display: 'inline-block'
                                                                        }}>
                                                                            Completed
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <span style={{ color: '#999', fontSize: '12px' }}>View Only</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AttendancePage;
