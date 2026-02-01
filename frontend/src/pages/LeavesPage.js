import React, { useState, useEffect } from 'react';
import { employeeAPI, leaveAPI } from '../services/api';

function LeavesPage() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [leaveType, setLeaveType] = useState('leave');
    const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [reason, setReason] = useState('');
    const [balances, setBalances] = useState(null);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get logged-in user from localStorage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                
                // If employee, auto-select themselves
                if (user && user.employee_code && user.role === 'employee') {
                    setSelectedEmployee(user.employee_code);
                }
            }
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            setCurrentUser(null);
        }
    }, []);

    useEffect(() => {
        loadEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            loadBalances();
            loadLeaveHistory();
        }
    }, [selectedEmployee]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const loadEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees(response.data.data);
        } catch (error) {
            showMessage('error', 'Failed to load employees');
        }
    };

    const loadBalances = async () => {
        if (!selectedEmployee) return;
        try {
            const response = await leaveAPI.getBalances(selectedEmployee);
            setBalances(response.data.data);
        } catch (error) {
            console.error('Error loading balances:', error);
            showMessage('error', error.response?.data?.message || 'Failed to load leave balances');
        }
    };

    const loadLeaveHistory = async () => {
        if (!selectedEmployee) return;
        try {
            const response = await leaveAPI.getHistory(selectedEmployee);
            setLeaveHistory(response.data.data || []);
        } catch (error) {
            console.error('Error loading history:', error);
            showMessage('error', error.response?.data?.message || 'Failed to load leave history');
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            const response = await leaveAPI.apply(selectedEmployee, leaveDate, leaveType, notes, reason);
            
            if (response.data.was_converted) {
                showMessage('warning', response.data.message);
            } else {
                showMessage('success', 'Leave applied successfully');
            }
            
            setNotes('');
            setReason('');
            loadBalances();
            loadLeaveHistory();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to apply leave');
        }
    };


    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.admin_id);
    const canManageEmployee = (employeeCode) => {
        // Admin can manage anyone
        if (isAdmin) return true;
        // Employee can only manage themselves
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
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h1 style={{ margin: 0 }}>Leave Management</h1>
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
                <div className={`alert alert-${message.type === 'success' ? 'success' : message.type === 'warning' ? 'warning' : 'error'}`}>
                    {message.text}
                </div>
            )}

            <div className="card">
                <h3>Apply Leave</h3>
                <form onSubmit={handleApplyLeave}>
                    <div className="grid grid-2">
                        {isAdmin ? (
                            <div className="form-group">
                                <label>Employee *</label>
                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Employee --</option>
                                    {employees.map(emp => (
                                        <option key={emp.employee_code} value={emp.employee_code}>
                                            {emp.name} ({emp.employee_code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Employee</label>
                                <input
                                    type="text"
                                    value={(() => {
                                        if (!currentUser || !currentUser.employee_code) return 'Loading...';
                                        const emp = employees.find(e => e.employee_code === currentUser.employee_code);
                                        return emp ? `${emp.name} (${currentUser.employee_code})` : currentUser.employee_code;
                                    })()}
                                    disabled
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Leave Type *</label>
                            <select
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value)}
                                required
                            >
                                <option value="leave">Leave</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={leaveDate}
                                onChange={(e) => setLeaveDate(e.target.value)}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="form-group">
                            <label>Reason *</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for leave"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Additional Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional additional notes"
                                rows="3"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={!selectedEmployee || (currentUser && currentUser.role === 'employee' && !canManageEmployee(selectedEmployee))}
                    >
                        Apply Leave
                    </button>
                </form>
            </div>

            {selectedEmployee && balances && canManageEmployee(selectedEmployee) && (
                <div className="card">
                    <h3>Leave Balances</h3>
                    <div className="grid grid-2">
                        <div>
                            <strong>Leave Balance:</strong> {Math.floor(balances.leave_balance || 0)}
                        </div>
                        <div>
                            <strong>Leave Allotted:</strong> {Math.floor(balances.leave_allotted || 0)}
                        </div>
                    </div>
                </div>
            )}

            {selectedEmployee && leaveHistory.length > 0 && (
                <div className="card">
                    <h3>Leave History</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Transaction</th>
                                <th>Amount</th>
                                <th>Balance After</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveHistory.map(record => (
                                <tr key={record.transaction_id}>
                                    <td>{new Date(record.created_at).toLocaleDateString()}</td>
                                    <td>{record.leave_type.toUpperCase()}</td>
                                    <td>{record.transaction_type}</td>
                                    <td>{Math.floor(parseFloat(record.amount) || 0)}</td>
                                    <td>{Math.floor(parseFloat(record.balance_after) || 0)}</td>
                                    <td>{record.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}

export default LeavesPage;
