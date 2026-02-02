import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function LoginPage() {
    const [loginType, setLoginType] = useState('admin');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingPortalAuth, setCheckingPortalAuth] = useState(true);
    const navigate = useNavigate();

    // Check for portal auth token on mount
    useEffect(() => {
        checkPortalAuth();
    }, []);

const checkPortalAuth = async () => {
    try {
        // Skip portal auth check in local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Local development - skipping portal auth check');
            setCheckingPortalAuth(false);
            return;
        }

        // Only check portal auth in production
        const response = await authAPI.checkPortalAuth();
        
        if (response.data.authenticated && response.data.employee_code) {
            console.log('Portal auth detected, auto-login for:', response.data.employee_code);
            
            const loginResponse = await authAPI.portalLogin(response.data.employee_code);
            const { token, user } = loginResponse.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect to /attendance for employees (not /dashboard)
            navigate('/attendance');
        } else {
            setCheckingPortalAuth(false);
        }
    } catch (err) {
        console.log('No portal auth, showing login form');
        setCheckingPortalAuth(false);
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let response;
            if (loginType === 'admin') {
                response = await authAPI.login(username, password);
            } else if (loginType === 'employee') {
                response = await authAPI.employeeLogin(email, password);
            } else if (loginType === 'freelancer') {
                response = await authAPI.freelancerLogin(email, password);
            }

            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'admin' || user.admin_id) {
                navigate('/dashboard');
            } else if (user.role === 'employee') {
                navigate('/attendance');
            } else if (user.role === 'freelancer') {
                navigate('/freelancers');
            }
        } catch (err) {
            console.error('Login error:', err);
            let errorMessage = 'Login failed. Please try again.';

            if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error') || !err.response) {
                errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (checkingPortalAuth) {
        return (
            <div className="container" style={{ maxWidth: '400px', marginTop: '100px', textAlign: 'center' }}>
                <div className="card">
                    <h2>🔄 Checking authentication...</h2>
                    <p>Please wait while we verify your portal login.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
                    Accunite Attendance System
                </h2>

                <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setLoginType('admin');
                            setError('');
                            setUsername('');
                            setEmail('');
                            setPassword('');
                        }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            background: loginType === 'admin' ? '#007bff' : 'transparent',
                            color: loginType === 'admin' ? 'white' : '#666',
                            cursor: 'pointer',
                            fontWeight: loginType === 'admin' ? 'bold' : 'normal'
                        }}
                    >
                        Admin Login
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setLoginType('employee');
                            setError('');
                            setUsername('');
                            setEmail('');
                            setPassword('');
                        }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            background: loginType === 'employee' ? '#007bff' : 'transparent',
                            color: loginType === 'employee' ? 'white' : '#666',
                            cursor: 'pointer',
                            fontWeight: loginType === 'employee' ? 'bold' : 'normal'
                        }}
                    >
                        Employee Login
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setLoginType('freelancer');
                            setError('');
                            setUsername('');
                            setEmail('');
                            setPassword('');
                        }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            background: loginType === 'freelancer' ? '#007bff' : 'transparent',
                            color: loginType === 'freelancer' ? 'white' : '#666',
                            cursor: 'pointer',
                            fontWeight: loginType === 'freelancer' ? 'bold' : 'normal'
                        }}
                    >
                        Freelancer Login
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {loginType === 'admin' ? (
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                                placeholder="Enter username"
                            />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                placeholder="Enter your email"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

            </div>
        </div>
    );
}

export default LoginPage;
