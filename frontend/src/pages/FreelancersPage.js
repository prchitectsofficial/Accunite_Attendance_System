import React, { useState, useEffect } from 'react';
import { freelancerAPI } from '../services/api';

function FreelancersPage() {
    const [freelancers, setFreelancers] = useState([]);
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [activeSessions, setActiveSessions] = useState({}); // Track active sessions per freelancer
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
    const [sessionSummary, setSessionSummary] = useState({ totalHours: 0, totalBilling: 0, totalSessions: 0 });
    const [showModal, setShowModal] = useState(false);
    const [showCredentialModal, setShowCredentialModal] = useState(false);
    const [newFreelancer, setNewFreelancer] = useState({ name: '', hourly_rate: '', freelancer_code: '' });
    const [credentialFreelancer, setCredentialFreelancer] = useState(null);
    const [credentialEmail, setCredentialEmail] = useState('');
    const [credentialPassword, setCredentialPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentUser, setCurrentUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [freelancerToDelete, setFreelancerToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showWorkSummaryModal, setShowWorkSummaryModal] = useState(false);
    const [workSummary, setWorkSummary] = useState('');
    const [freelancerToClockOut, setFreelancerToClockOut] = useState(null);

    useEffect(() => {
        // Get logged-in user from localStorage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                
                // If freelancer, auto-select themselves and load their data
                if (user && user.freelancer_id && user.role === 'freelancer') {
                    loadFreelancerData(user.freelancer_id);
                } else {
                    loadFreelancers();
                }
            } else {
                loadFreelancers();
            }
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            setCurrentUser(null);
            loadFreelancers();
        } finally {
            setLoading(false);
        }
    }, []);

    // Reload sessions when month filter changes
    useEffect(() => {
        if (selectedMonth) {
            if (selectedFreelancer) {
                loadSessions(selectedFreelancer.freelancer_id, selectedMonth);
            } else if (currentUser && currentUser.role === 'freelancer' && currentUser.freelancer_id) {
                loadFreelancerData(currentUser.freelancer_id);
            }
        }
    }, [selectedMonth]);

    const loadFreelancerData = async (freelancerId) => {
        try {
            // Calculate date range for selected month
            let startDate = null;
            let endDate = null;
            
            if (selectedMonth) {
                const year = parseInt(selectedMonth.split('-')[0]);
                const monthNum = parseInt(selectedMonth.split('-')[1]);
                startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
                const lastDay = new Date(year, monthNum, 0).getDate();
                endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            }
            
            const [freelancerRes, sessionsRes] = await Promise.all([
                freelancerAPI.getById(freelancerId),
                freelancerAPI.getSessions(freelancerId, startDate, endDate)
            ]);
            const freelancerData = freelancerRes.data.data;
            setFreelancers([freelancerData]);
            setSelectedFreelancer(freelancerData);
            const sessionsData = sessionsRes.data.data || [];
            setSessions(sessionsData);
            
            // Check for active session and update activeSessions state
            // Check both is_complete === false and is_complete === 0 (MySQL returns 0/1 for BOOLEAN)
            const incompleteSession = sessionsData.find(s => 
                s.is_complete === false || s.is_complete === 0 || s.is_complete === '0' || !s.logout_time
            );
            if (incompleteSession) {
                setActiveSessions(prev => ({
                    ...prev,
                    [freelancerId]: incompleteSession
                }));
            } else {
                setActiveSessions(prev => {
                    const updated = { ...prev };
                    delete updated[freelancerId];
                    return updated;
                });
            }
            
            // Calculate summary for freelancer's own sessions
            let totalMinutes = 0;
            let totalBilling = 0;
            sessionsData.forEach(session => {
                if (session.session_duration_minutes) {
                    totalMinutes += session.session_duration_minutes;
                }
                if (session.session_value) {
                    totalBilling += parseFloat(session.session_value);
                }
            });
            
            setSessionSummary({
                totalHours: (totalMinutes / 60).toFixed(2),
                totalBilling: totalBilling.toFixed(2),
                totalSessions: sessionsData.length
            });
        } catch (error) {
            showMessage('error', 'Failed to load freelancer data');
        }
    };

    const loadFreelancers = async () => {
        try {
            const response = await freelancerAPI.getAll();
            const freelancersData = response.data.data;
            setFreelancers(freelancersData);
            
            // Load active sessions for each freelancer (only for admin, freelancers see all but can only act on themselves)
            const activeSessionsMap = {};
            for (const freelancer of freelancersData) {
                try {
                    const sessionsRes = await freelancerAPI.getSessions(freelancer.freelancer_id);
                    // Check both is_complete === false and is_complete === 0 (MySQL returns 0/1 for BOOLEAN)
                    const incompleteSession = (sessionsRes.data.data || []).find(
                        s => s.is_complete === false || s.is_complete === 0 || s.is_complete === '0' || !s.logout_time
                    );
                    if (incompleteSession) {
                        activeSessionsMap[freelancer.freelancer_id] = incompleteSession;
                    } else {
                        // Explicitly remove from map if no incomplete session
                        delete activeSessionsMap[freelancer.freelancer_id];
                    }
                } catch (err) {
                    // Ignore errors for individual freelancer sessions
                    console.error(`Error loading sessions for freelancer ${freelancer.freelancer_id}:`, err);
                }
            }
            setActiveSessions(activeSessionsMap);
        } catch (error) {
            showMessage('error', 'Failed to load freelancers');
        }
    };
    
    const canManageFreelancer = (freelancerId) => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'freelancer' && currentUser.freelancer_id === freelancerId) return true;
        return false;
    };

    const loadSessions = async (freelancerId, month = null) => {
        try {
            let startDate = null;
            let endDate = null;
            
            if (month) {
                // Get first and last day of selected month
                const year = parseInt(month.split('-')[0]);
                const monthNum = parseInt(month.split('-')[1]);
                startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
                const lastDay = new Date(year, monthNum, 0).getDate();
                endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            }
            
            const response = await freelancerAPI.getSessions(freelancerId, startDate, endDate);
            const sessionsData = response.data.data || [];
            setSessions(sessionsData);
            
            // Calculate summary
            let totalMinutes = 0;
            let totalBilling = 0;
            sessionsData.forEach(session => {
                if (session.session_duration_minutes) {
                    totalMinutes += session.session_duration_minutes;
                }
                if (session.session_value) {
                    totalBilling += parseFloat(session.session_value);
                }
            });
            
            setSessionSummary({
                totalHours: (totalMinutes / 60).toFixed(2),
                totalBilling: totalBilling.toFixed(2),
                totalSessions: sessionsData.length
            });
        } catch (error) {
            showMessage('error', 'Failed to load sessions');
        }
    };

    const handleSelectFreelancer = (freelancer) => {
        setSelectedFreelancer(freelancer);
        loadSessions(freelancer.freelancer_id, selectedMonth);
    };
    
    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        setSelectedMonth(newMonth);
        if (selectedFreelancer) {
            loadSessions(selectedFreelancer.freelancer_id, newMonth);
        }
    };

    const handleClockIn = async (freelancerId) => {
        try {
            if (!freelancerId) {
                showMessage('error', 'Invalid freelancer ID');
                return;
            }
            const response = await freelancerAPI.clockIn(freelancerId);
            showMessage('success', 'Clocked in successfully');
            
            // Update active sessions
            const sessionsRes = await freelancerAPI.getSessions(freelancerId);
            // Check both is_complete === false and is_complete === 0 (MySQL returns 0/1 for BOOLEAN)
            const incompleteSession = (sessionsRes.data.data || []).find(s => 
                s.is_complete === false || s.is_complete === 0 || s.is_complete === '0' || !s.logout_time
            );
            if (incompleteSession) {
                setActiveSessions(prev => ({
                    ...prev,
                    [freelancerId]: incompleteSession
                }));
            }
            
            // If freelancer is viewing their own data, reload it
            if (currentUser && currentUser.role === 'freelancer' && currentUser.freelancer_id === freelancerId) {
                loadFreelancerData(freelancerId);
            } else if (selectedFreelancer?.freelancer_id === freelancerId) {
                loadSessions(freelancerId, selectedMonth);
            }
            // Reload freelancers to refresh active sessions
            loadFreelancers();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Clock in failed');
        }
    };

    const handleClockOutClick = (freelancerId) => {
        setFreelancerToClockOut(freelancerId);
        setWorkSummary('');
        setShowWorkSummaryModal(true);
    };

    const handleClockOutConfirm = async () => {
        if (!workSummary.trim()) {
            showMessage('error', 'Please enter work summary before clocking out');
            return;
        }

        try {
            if (!freelancerToClockOut) {
                showMessage('error', 'Invalid freelancer ID');
                return;
            }
            await freelancerAPI.clockOut(freelancerToClockOut, workSummary);
            showMessage('success', 'Clocked out successfully');
            
            // Remove from active sessions
            setActiveSessions(prev => {
                const updated = { ...prev };
                delete updated[freelancerToClockOut];
                return updated;
            });
            
            setShowWorkSummaryModal(false);
            setWorkSummary('');
            setFreelancerToClockOut(null);
            
            // Wait a bit for database to update, then reload data
            setTimeout(() => {
                // If freelancer is viewing their own data, reload it
                if (currentUser && currentUser.role === 'freelancer' && currentUser.freelancer_id === freelancerToClockOut) {
                    loadFreelancerData(freelancerToClockOut);
                } else if (selectedFreelancer?.freelancer_id === freelancerToClockOut) {
                    loadSessions(freelancerToClockOut, selectedMonth);
                }
                // Reload freelancers to refresh active sessions
                loadFreelancers();
            }, 500);
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Clock out failed');
        }
    };

    const handleAddFreelancer = async (e) => {
        e.preventDefault();
        try {
            await freelancerAPI.create(newFreelancer);
            showMessage('success', 'Freelancer added successfully');
            setShowModal(false);
            setNewFreelancer({ name: '', hourly_rate: '', freelancer_code: '' });
            loadFreelancers();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to add freelancer');
        }
    };

    const handleAssignCredentials = (freelancer) => {
        setCredentialFreelancer(freelancer);
        setCredentialEmail(freelancer.email || '');
        // Show actual password if available, otherwise placeholder
        setCredentialPassword(freelancer.password_plain || (freelancer.password_hash ? '••••••••' : ''));
        setShowPassword(true); // Show password by default if it exists
        setShowCredentialModal(true);
    };

    const handleSaveCredentials = async (e) => {
        e.preventDefault();
        try {
            // If password is the placeholder and no plain text exists, treat it as empty (keep current)
            const passwordToSend = (credentialPassword === '••••••••' && !credentialFreelancer.password_plain) || credentialPassword === ''
                ? undefined 
                : credentialPassword;
            
            // Check if email changed
            const emailChanged = credentialEmail !== credentialFreelancer.email;
            
            // Check if password changed (only if it's different from current)
            const passwordChanged = passwordToSend && passwordToSend !== credentialFreelancer.password_plain;
            
            // If no changes, just close
            if (!emailChanged && !passwordChanged && credentialFreelancer.password_hash) {
                showMessage('info', 'No changes to save');
                setShowCredentialModal(false);
                return;
            }
            
            await freelancerAPI.assignCredentials(
                credentialFreelancer.freelancer_id,
                credentialEmail,
                passwordToSend
            );
            
            showMessage('success', 'Credentials assigned successfully');
            setShowCredentialModal(false);
            loadFreelancers();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to assign credentials');
        }
    };

    const handleDeleteClick = (freelancer) => {
        setFreelancerToDelete(freelancer);
        setDeleteConfirmText('');
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmText !== 'DELETE') {
            showMessage('error', 'Please type DELETE to confirm deletion');
            return;
        }

        try {
            await freelancerAPI.delete(freelancerToDelete.freelancer_id);
            showMessage('success', 'Freelancer deleted successfully');
            setShowDeleteModal(false);
            setFreelancerToDelete(null);
            setDeleteConfirmText('');
            loadFreelancers();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to delete freelancer');
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.admin_id);
    const isFreelancer = currentUser && currentUser.role === 'freelancer';

    if (loading) return <div className="loading">Loading freelancers...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h1 style={{ margin: 0 }}>Freelancers</h1>
                {currentUser && (
                    <div style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#f0f0f0', 
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        Logged in as: <strong>{currentUser.name || currentUser.username || 'User'}</strong> {isAdmin && <span style={{ color: '#007bff' }}>(Admin)</span>}
                    </div>
                )}
            </div>
            {isAdmin && (
                <div style={{ marginBottom: '20px' }}>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Freelancer</button>
                </div>
            )}

            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}

            <div className="card">
                <h3>Freelancer List</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Freelancer Code</th>
                            <th>Name</th>
                            <th>Hourly Rate</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {freelancers.map(f => (
                            <tr key={f.freelancer_id}>
                                <td>{f.freelancer_code || 'N/A'}</td>
                                <td>{f.name}</td>
                                <td>₹{f.hourly_rate}</td>
                                <td>
                                    <span className={`badge badge-${f.status === 'active' ? 'success' : 'danger'}`}>
                                        {f.status}
                                    </span>
                                </td>
                                <td>
                                    {isAdmin && (
                                        <>
                                            <button 
                                                className="btn btn-sm btn-info" 
                                                onClick={() => handleAssignCredentials(f)}
                                                style={{ marginRight: '5px' }}
                                            >
                                                {f.email && f.password_hash ? 'View/Edit Credentials' : 'Assign Credentials'}
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger" 
                                                onClick={() => handleDeleteClick(f)}
                                                style={{ marginRight: '5px' }}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    {(isAdmin || (isFreelancer && currentUser && currentUser.freelancer_id === f.freelancer_id)) && (
                                        <>
                                            {(() => {
                                                const activeSession = activeSessions[f.freelancer_id];
                                                const isClockedIn = activeSession && (
                                                    activeSession.is_complete === false || 
                                                    activeSession.is_complete === 0 || 
                                                    activeSession.is_complete === '0' ||
                                                    !activeSession.logout_time
                                                );
                                                return isClockedIn ? (
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleClockOutClick(f.freelancer_id)} style={{ marginRight: '5px' }}>Clock Out</button>
                                                ) : (
                                                    <button className="btn btn-sm btn-success" onClick={() => handleClockIn(f.freelancer_id)} style={{ marginRight: '5px' }}>Clock In</button>
                                                );
                                            })()}
                                        </>
                                    )}
                                    <button className="btn btn-sm btn-primary" onClick={() => handleSelectFreelancer(f)}>View Sessions</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedFreelancer && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Sessions for {selectedFreelancer.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ fontWeight: 'bold' }}>Filter by Month:</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                max={new Date().toISOString().slice(0, 7)}
                                style={{
                                    padding: '5px 10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                    
                    {/* Summary Card */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        marginBottom: '20px', 
                        padding: '15px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '5px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div>
                            <strong>Total Sessions:</strong> {sessionSummary.totalSessions}
                        </div>
                        <div>
                            <strong>Total Hours:</strong> {sessionSummary.totalHours} hrs
                        </div>
                        <div>
                            <strong>Total Billing:</strong> ₹{sessionSummary.totalBilling}
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Login Time</th>
                                <th>Logout Time</th>
                                <th>Duration</th>
                                <th>Amount (INR)</th>
                                <th>Work Summary</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                        No sessions found for the selected month
                                    </td>
                                </tr>
                            ) : (
                                sessions.map(s => (
                                    <tr key={s.session_id}>
                                        <td>{new Date(s.session_date).toLocaleDateString()}</td>
                                        <td>{new Date(s.login_time).toLocaleTimeString()}</td>
                                        <td>{s.logout_time ? new Date(s.logout_time).toLocaleTimeString() : 'N/A'}</td>
                                        <td>{formatDuration(s.session_duration_minutes)}</td>
                                        <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                                            {s.session_value ? `₹${parseFloat(s.session_value).toFixed(2)}` : s.is_complete ? '₹0.00' : 'N/A'}
                                        </td>
                                        <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                                            {s.work_summary || <span style={{ color: '#999', fontStyle: 'italic' }}>No summary</span>}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${s.is_complete ? 'success' : 'warning'}`}>
                                                {s.is_complete ? 'Complete' : 'Incomplete'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Freelancer</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddFreelancer}>
                            <div className="form-group">
                                <label>Freelancer Code *</label>
                                <input
                                    type="text"
                                    value={newFreelancer.freelancer_code}
                                    onChange={(e) => setNewFreelancer({...newFreelancer, freelancer_code: e.target.value})}
                                    placeholder="e.g., FL001"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={newFreelancer.name}
                                    onChange={(e) => setNewFreelancer({...newFreelancer, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Hourly Rate (INR) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newFreelancer.hourly_rate}
                                    onChange={(e) => setNewFreelancer({...newFreelancer, hourly_rate: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Add Freelancer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showCredentialModal && credentialFreelancer && (
                <div className="modal-overlay" onClick={() => setShowCredentialModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{credentialFreelancer.email && credentialFreelancer.password_hash ? 'View/Edit Credentials' : 'Assign Credentials'} - {credentialFreelancer.name}</h2>
                            <button className="close-btn" onClick={() => setShowCredentialModal(false)}>×</button>
                        </div>
                        {credentialFreelancer.email && credentialFreelancer.password_hash && (
                            <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#d4edda', borderRadius: '5px', color: '#155724' }}>
                                ✓ Credentials are already assigned. You can update them below.
                            </div>
                        )}
                        <form onSubmit={handleSaveCredentials}>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={credentialEmail}
                                    onChange={(e) => setCredentialEmail(e.target.value)}
                                    required
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password {credentialFreelancer.password_hash ? '(leave blank to keep current)' : '*'}</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={credentialPassword}
                                        onChange={(e) => setCredentialPassword(e.target.value)}
                                        required={!credentialFreelancer.password_hash}
                                        placeholder={credentialFreelancer.password_plain || "Enter password"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#666',
                                            fontSize: '12px'
                                        }}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {credentialFreelancer.password_hash && (
                                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                                        Current password is displayed above. Leave blank to keep it unchanged, or enter a new password to update.
                                    </small>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                {credentialFreelancer.password_hash ? 'Update Credentials' : 'Assign Credentials'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && freelancerToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete Freelancer</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '15px', color: '#721c24', fontWeight: 'bold' }}>
                                Are you sure you want to delete <strong>{freelancerToDelete.name}</strong>?
                            </p>
                            <p style={{ marginBottom: '20px', color: '#666' }}>
                                This action cannot be undone. Type <strong>DELETE</strong> to confirm:
                            </p>
                            <div className="form-group">
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: deleteConfirmText === 'DELETE' ? '2px solid #28a745' : '2px solid #dc3545',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteConfirmText !== 'DELETE'}
                                    style={{
                                        flex: 1,
                                        opacity: deleteConfirmText !== 'DELETE' ? 0.5 : 1,
                                        cursor: deleteConfirmText !== 'DELETE' ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Delete Freelancer
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setFreelancerToDelete(null);
                                        setDeleteConfirmText('');
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showWorkSummaryModal && (
                <div className="modal-overlay" onClick={() => setShowWorkSummaryModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Clock Out - Work Summary</h2>
                            <button className="close-btn" onClick={() => setShowWorkSummaryModal(false)}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '15px', color: '#666' }}>
                                Please enter a summary of work completed during this session:
                            </p>
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                                    Work Summary <span style={{ color: 'red' }}>*</span>
                                </label>
                                <textarea
                                    value={workSummary}
                                    onChange={(e) => setWorkSummary(e.target.value)}
                                    placeholder="Describe the work you completed during this session..."
                                    required
                                    rows={6}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleClockOutConfirm}
                                    disabled={!workSummary.trim()}
                                    style={{
                                        flex: 1,
                                        opacity: !workSummary.trim() ? 0.5 : 1,
                                        cursor: !workSummary.trim() ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Clock Out
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowWorkSummaryModal(false);
                                        setWorkSummary('');
                                        setFreelancerToClockOut(null);
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FreelancersPage;
