import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from './services/api';
import './styles/App.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import FreelancersPage from './pages/FreelancersPage';
import AttendancePage from './pages/AttendancePage';
import LeavesPage from './pages/LeavesPage';
import ReportsPage from './pages/ReportsPage';
import SalarySlipPage from './pages/SalarySlipPage';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user.role !== 'admin' && !user.admin_id) {
        return <Navigate to="/attendance" replace />;
    }

    return children;
}

// Navbar Component
function Navbar({ onLogout }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = user && (user.role === 'admin' || user.admin_id);
    const isFreelancer = user && user.role === 'freelancer';

    return (
        <nav className="navbar">
            <h1>Accunite Attendance System</h1>
            <div className="navbar-menu">
                {isAdmin && <Link to="/dashboard">Dashboard</Link>}
                {isAdmin && <Link to="/employees">Employees</Link>}
                {(isAdmin || isFreelancer) && <Link to="/freelancers">Freelancers</Link>}
                {!isFreelancer && <Link to="/attendance">Attendance</Link>}
                {!isFreelancer && <Link to="/leaves">Leaves</Link>}
                {!isFreelancer && <Link to="/salary-slip">Salary Slip</Link>}
                {isAdmin && <Link to="/reports">Reports</Link>}
                <button 
                    onClick={onLogout}
                    style={{
                        background: 'transparent',
                        border: '1px solid white',
                        color: 'white',
                        padding: '5px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '10px'
                    }}
                >
                    Logout ({user?.name || user?.username || 'User'})
                </button>
            </div>
        </nav>
    );
}

// Inner App component that uses useLocation
function AppContent() {
    const [user, setUser] = useState(null);
    const [checkingPortalAuth, setCheckingPortalAuth] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Check if user is logged in
        const checkUser = async () => {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            
            // If user is already logged in, set user state
            if (storedUser && storedToken) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error('Error parsing user from localStorage:', e);
                    setUser(null);
                }
            } else {
                // If not logged in, check for portal SSO (only in production, not localhost)
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    setCheckingPortalAuth(true);
                    try {
                        const response = await authAPI.checkPortalAuth();
                        
                        if (response.data.authenticated && response.data.employee_code) {
                            console.log('Portal SSO detected, auto-login for:', response.data.employee_code);
                            
                            const loginResponse = await authAPI.portalLogin(response.data.employee_code);
                            const { token, user: portalUser } = loginResponse.data;

                            localStorage.setItem('token', token);
                            localStorage.setItem('user', JSON.stringify(portalUser));
                            setUser(portalUser);
                            
                            // If on login page or root, redirect to attendance
                            if (location.pathname === '/login' || location.pathname === '/') {
                                window.location.href = '/attendance';
                            }
                        }
                    } catch (err) {
                        console.log('No portal SSO, user needs to login normally');
                    } finally {
                        setCheckingPortalAuth(false);
                    }
                } else {
                    setUser(null);
                }
            }
        };

        // Check on mount and whenever location changes
        checkUser();

        // Also listen for storage changes (in case login happens in another tab)
        const handleStorageChange = () => {
            checkUser();
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Check user on every route change
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    // Check localStorage directly for navbar display (more reliable)
    const hasUser = () => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        return storedUser && storedToken;
    };

    return (
        <div className="app">
            {hasUser() && <Navbar onLogout={handleLogout} />}
            <div className="main-content">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route 
                            path="/dashboard" 
                            element={
                                <ProtectedRoute requireAdmin={true}>
                                    <DashboardPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/employees" 
                            element={
                                <ProtectedRoute requireAdmin={true}>
                                    <EmployeesPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/freelancers" 
                            element={
                                <ProtectedRoute>
                                    <FreelancersPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/attendance" 
                            element={
                                <ProtectedRoute>
                                    <AttendancePage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/leaves" 
                            element={
                                <ProtectedRoute>
                                    <LeavesPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/salary-slip" 
                            element={
                                <ProtectedRoute>
                                    <SalarySlipPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/reports" 
                            element={
                                <ProtectedRoute requireAdmin={true}>
                                    <ReportsPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/" 
                            element={
                                user ? (
                                    user.role === 'admin' || user.admin_id ? (
                                        <Navigate to="/dashboard" replace />
                                    ) : user.role === 'employee' ? (
                                        <Navigate to="/attendance" replace />
                                    ) : user.role === 'freelancer' ? (
                                        <Navigate to="/freelancers" replace />
                                    ) : (
                                        <Navigate to="/attendance" replace />
                                    )
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            } 
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
    );
}

// Main App component with Router
function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
