import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';

function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCredentialModal, setShowCredentialModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [credentialEmployee, setCredentialEmployee] = useState(null);
    const [credentialEmail, setCredentialEmail] = useState('');
    const [credentialPassword, setCredentialPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees(response.data.data);
        } catch (error) {
            showMessage('error', 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingEmployee({
            employee_code: '',
            name: '',
            email: '',
            salary: '',
            attendance_type: 'clocking',
            cl_balance: 12,
            pl_balance: 15
        });
        setShowModal(true);
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee.employee_code && employees.find(emp => emp.employee_code === editingEmployee.employee_code)) {
                await employeeAPI.update(editingEmployee.employee_code, editingEmployee);
                showMessage('success', 'Employee updated successfully');
            } else {
                await employeeAPI.create(editingEmployee);
                showMessage('success', 'Employee created successfully');
            }
            setShowModal(false);
            loadEmployees();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setDeleteConfirmText('');
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmText !== 'DELETE') {
            showMessage('error', 'Please type DELETE to confirm deletion');
            return;
        }

        try {
            await employeeAPI.delete(employeeToDelete.employee_code);
            showMessage('success', 'Employee deleted successfully');
            setShowDeleteModal(false);
            setEmployeeToDelete(null);
            setDeleteConfirmText('');
            loadEmployees();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to delete employee');
        }
    };

    const handleAssignCredentials = (employee) => {
        setCredentialEmployee(employee);
        setCredentialEmail(employee.email || '');
        // Show actual password if available, otherwise placeholder
        setCredentialPassword(employee.password_plain || (employee.password_hash ? '••••••••' : ''));
        setShowPassword(true); // Show password by default if it exists
        setShowCredentialModal(true);
    };

    const handleSaveCredentials = async (e) => {
        e.preventDefault();
        try {
            // If password is the placeholder and no plain text exists, treat it as empty (keep current)
            const passwordToSend = (credentialPassword === '••••••••' && !credentialEmployee.password_plain) || credentialPassword === ''
                ? undefined 
                : credentialPassword;
            
            // Check if email changed
            const emailChanged = credentialEmail !== credentialEmployee.email;
            
            // Check if password changed (only if it's different from current)
            const passwordChanged = passwordToSend && passwordToSend !== credentialEmployee.password_plain;
            
            // If no changes, just close
            if (!emailChanged && !passwordChanged && credentialEmployee.password_hash) {
                showMessage('info', 'No changes to save');
                setShowCredentialModal(false);
                return;
            }
            
            await employeeAPI.assignCredentials(
                credentialEmployee.employee_code,
                credentialEmail,
                passwordToSend // Send undefined if empty (backend will keep existing)
            );
            showMessage('success', credentialEmployee.password_hash ? 'Credentials updated successfully' : 'Credentials assigned successfully');
            setShowCredentialModal(false);
            loadEmployees();
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to assign credentials');
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    if (loading) return <div className="loading">Loading employees...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Employees</h1>
                <button className="btn btn-primary" onClick={handleAdd}>Add Employee</button>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Employee Code</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>CL Balance</th>
                            <th>PL Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.employee_code}>
                                <td>{emp.employee_code}</td>
                                <td>{emp.name}</td>
                                <td>{emp.attendance_type}</td>
                                <td>{emp.cl_balance}</td>
                                <td>{emp.pl_balance}</td>
                                <td>
                                    <span className={`badge badge-${emp.status === 'active' ? 'success' : 'danger'}`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(emp)}>Edit</button>
                                    {' '}
                                    <button 
                                        className={`btn btn-sm ${emp.email && emp.password_hash ? 'btn-info' : 'btn-success'}`} 
                                        onClick={() => handleAssignCredentials(emp)}
                                    >
                                        {emp.email && emp.password_hash ? 'View/Edit Credentials' : 'Assign Credentials'}
                                    </button>
                                    {' '}
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(emp)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingEmployee.employee_code ? 'Edit Employee' : 'Add Employee'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Employee Code *</label>
                                <input
                                    type="text"
                                    value={editingEmployee.employee_code}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, employee_code: e.target.value})}
                                    required
                                    disabled={!!editingEmployee.employee_code && employees.find(e => e.employee_code === editingEmployee.employee_code)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={editingEmployee.name}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editingEmployee.email || ''}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Salary</label>
                                <input
                                    type="number"
                                    value={editingEmployee.salary || ''}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, salary: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Attendance Type *</label>
                                <select
                                    value={editingEmployee.attendance_type}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, attendance_type: e.target.value})}
                                    required
                                >
                                    <option value="clocking">Clocking</option>
                                    <option value="non-clocking">Non-Clocking</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>CL Balance</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editingEmployee.cl_balance || 0}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, cl_balance: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>PL Balance</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editingEmployee.pl_balance || 0}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, pl_balance: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Save Employee
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showCredentialModal && credentialEmployee && (
                <div className="modal-overlay" onClick={() => setShowCredentialModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{credentialEmployee.email && credentialEmployee.password_hash ? 'View/Edit Credentials' : 'Assign Credentials'} - {credentialEmployee.name}</h2>
                            <button className="close-btn" onClick={() => setShowCredentialModal(false)}>×</button>
                        </div>
                        {credentialEmployee.email && credentialEmployee.password_hash && (
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
                                    placeholder="employee@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={credentialPassword}
                                        onChange={(e) => {
                                            setCredentialPassword(e.target.value);
                                        }}
                                        onFocus={(e) => {
                                            // Clear placeholder when focused if it's the placeholder
                                            if (credentialPassword === '••••••••' && !credentialEmployee.password_plain) {
                                                setCredentialPassword('');
                                            }
                                        }}
                                        required={!credentialEmployee.password_hash}
                                        placeholder={credentialEmployee.password_hash 
                                            ? "Current password (visible above) or enter new password"
                                            : "Enter password"}
                                        minLength="6"
                                        style={{ paddingRight: '40px' }}
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
                                            fontSize: '14px',
                                            padding: '5px'
                                        }}
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                    {credentialEmployee.password_hash 
                                        ? "Current password is shown above. Enter a new password to change it (minimum 6 characters), or leave as is to keep current."
                                        : "Minimum 6 characters"}
                                </small>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                {credentialEmployee.email && credentialEmployee.password_hash ? 'Update Credentials' : 'Assign Credentials'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && employeeToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete Employee</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '15px', color: '#721c24', fontWeight: 'bold' }}>
                                Are you sure you want to delete <strong>{employeeToDelete.name}</strong> ({employeeToDelete.employee_code})?
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
                                    Delete Employee
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setEmployeeToDelete(null);
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

        </div>
    );
}

export default EmployeesPage;
