import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
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

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user is logged in
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <Router>
            <div className="app">
                {user && <Navbar onLogout={handleLogout} />}
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
        </Router>
    );
}

export default App;
