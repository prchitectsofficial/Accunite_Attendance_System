import React, { useState, useEffect } from 'react';
import { employeeAPI, reportAPI } from '../services/api';

function ReportsPage() {
    const [reportType, setReportType] = useState('employee-summary');
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees(response.data.data);
        } catch (error) {
            console.error('Error loading employees:', error);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            let response;
            
            switch (reportType) {
                case 'employee-summary':
                    if (!selectedEmployee) {
                        response = await reportAPI.getAllEmployeesSummary(startDate, endDate);
                    } else {
                        response = await reportAPI.getEmployeeSummary(selectedEmployee, startDate, endDate);
                    }
                    break;
                case 'daily-attendance':
                    response = await reportAPI.getDailyReport(startDate);
                    break;
                case 'late-arrivals':
                    response = await reportAPI.getLateArrivals(startDate, endDate);
                    break;
                case 'leave-usage':
                    response = await reportAPI.getLeaveUsage(startDate, endDate);
                    break;
                default:
                    throw new Error('Invalid report type');
            }

            setReportData(response.data.data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to generate report' });
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Reports</h1>

            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}

            <div className="card">
                <h3>Generate Report</h3>
                <div className="grid grid-2">
                    <div className="form-group">
                        <label>Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            <option value="employee-summary">Employee Summary</option>
                            <option value="daily-attendance">Daily Attendance</option>
                            <option value="late-arrivals">Late Arrivals</option>
                            <option value="leave-usage">Leave Usage</option>
                        </select>
                    </div>

                    {reportType === 'employee-summary' && (
                        <div className="form-group">
                            <label>Employee (Optional - leave blank for all)</label>
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                            >
                                <option value="">-- All Employees --</option>
                                {employees.map(emp => (
                                    <option key={emp.employee_code} value={emp.employee_code}>
                                        {emp.name} ({emp.employee_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    {reportType !== 'daily-attendance' && (
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <button 
                    className="btn btn-primary" 
                    onClick={generateReport}
                    disabled={loading}
                >
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>

            {reportData && (
                <div className="card">
                    <h3>Report Results</h3>
                    {renderReport()}
                </div>
            )}
        </div>
    );

    function renderReport() {
        if (!reportData) return null;

        switch (reportType) {
            case 'employee-summary':
                return renderEmployeeSummary();
            case 'daily-attendance':
                return renderDailyAttendance();
            case 'late-arrivals':
                return renderLateArrivals();
            case 'leave-usage':
                return renderLeaveUsage();
            default:
                return <p>No data available</p>;
        }
    }

    function renderEmployeeSummary() {
        if (selectedEmployee) {
            // Single employee summary
            return (
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Employee Code:</strong></td>
                            <td>{reportData.employee_code}</td>
                        </tr>
                        <tr>
                            <td><strong>Name:</strong></td>
                            <td>{reportData.name}</td>
                        </tr>
                        <tr>
                            <td><strong>Days Present:</strong></td>
                            <td>{reportData.days_present}</td>
                        </tr>
                        <tr>
                            <td><strong>CL Used:</strong></td>
                            <td>{reportData.cl_used}</td>
                        </tr>
                        <tr>
                            <td><strong>PL Used:</strong></td>
                            <td>{reportData.pl_used}</td>
                        </tr>
                        <tr>
                            <td><strong>CL Balance:</strong></td>
                            <td>{reportData.cl_balance}</td>
                        </tr>
                        <tr>
                            <td><strong>PL Balance:</strong></td>
                            <td>{reportData.pl_balance}</td>
                        </tr>
                        {reportData.late_arrivals > 0 && (
                            <tr>
                                <td><strong>Late Arrivals:</strong></td>
                                <td>{reportData.late_arrivals}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            );
        }

        // All employees summary
        return (
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Present</th>
                        <th>CL Used</th>
                        <th>PL Used</th>
                        <th>CL Balance</th>
                        <th>PL Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.summaries?.map(emp => (
                        <tr key={emp.employee_code}>
                            <td>{emp.name}</td>
                            <td>{emp.days_present}</td>
                            <td>{emp.cl_used}</td>
                            <td>{emp.pl_used}</td>
                            <td>{emp.cl_balance}</td>
                            <td>{emp.pl_balance}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    function renderDailyAttendance() {
        return (
            <>
                <div style={{ marginBottom: '20px' }}>
                    <strong>Date:</strong> {reportData.date}<br />
                    <strong>Total Employees:</strong> {reportData.summary?.total_employees}<br />
                    <strong>Present:</strong> {reportData.summary?.present}<br />
                    <strong>On Leave:</strong> {reportData.summary?.on_leave}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Status</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.marked_attendance?.map(record => (
                            <tr key={record.id}>
                                <td>{record.employee_name}</td>
                                <td>
                                    <span className={`badge badge-${record.status === 'present' ? 'success' : 'warning'}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td>{record.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString() : 'N/A'}</td>
                                <td>{record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString() : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    }

    function renderLateArrivals() {
        return (
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Clock In Time</th>
                        <th>Scheduled Time</th>
                        <th>Late By</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.late_arrivals?.map((record, idx) => (
                        <tr key={idx}>
                            <td>{new Date(record.attendance_date).toLocaleDateString()}</td>
                            <td>{record.employee_name}</td>
                            <td>{new Date(record.clock_in_time).toLocaleTimeString()}</td>
                            <td>{record.scheduled_time}</td>
                            <td>{record.late_by}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    function renderLeaveUsage() {
        return (
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>CL Used</th>
                        <th>PL Used</th>
                        <th>Current CL</th>
                        <th>Current PL</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.employees?.map(emp => (
                        <tr key={emp.employee_code}>
                            <td>{emp.name}</td>
                            <td>{emp.cl_used}</td>
                            <td>{emp.pl_used}</td>
                            <td>{emp.current_cl}</td>
                            <td>{emp.current_pl}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}

export default ReportsPage;
