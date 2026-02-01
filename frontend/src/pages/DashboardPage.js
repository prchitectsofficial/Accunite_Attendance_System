import React, { useState, useEffect } from 'react';
import { employeeAPI, freelancerAPI, reportAPI } from '../services/api';

function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalFreelancers: 0,
        presentToday: 0,
        onLeaveToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const [employeesRes, freelancersRes, dailyReportRes] = await Promise.all([
                employeeAPI.getAll(),
                freelancerAPI.getAll(),
                reportAPI.getDailyReport(today).catch((err) => {
                    console.error('Error loading daily report:', err);
                    return { data: { data: { summary: { present: 0, on_leave: 0 } } } };
                })
            ]);

            // Debug logging
            console.log('Dashboard data:', {
                employees: employeesRes.data,
                freelancers: freelancersRes.data,
                dailyReport: dailyReportRes.data
            });

            setStats({
                totalEmployees: employeesRes.data.count || employeesRes.data.data?.length || 0,
                totalFreelancers: freelancersRes.data.count || freelancersRes.data.data?.length || 0,
                presentToday: dailyReportRes.data?.data?.summary?.present ?? 0,
                onLeaveToday: dailyReportRes.data?.data?.summary?.on_leave ?? 0
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="container">
            <h1>Dashboard</h1>
            
            <div className="grid grid-2" style={{ marginTop: '30px' }}>
                <div className="card">
                    <h3>Total Employees</h3>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007bff', marginTop: '10px' }}>
                        {stats.totalEmployees}
                    </div>
                </div>

                <div className="card">
                    <h3>Total Freelancers</h3>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#17a2b8', marginTop: '10px' }}>
                        {stats.totalFreelancers}
                    </div>
                </div>

                <div className="card">
                    <h3>Present Today</h3>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745', marginTop: '10px' }}>
                        {stats.presentToday}
                    </div>
                </div>

                <div className="card">
                    <h3>On Leave Today</h3>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffc107', marginTop: '10px' }}>
                        {stats.onLeaveToday}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '30px' }}>
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/employees'}>
                        Manage Employees
                    </button>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/attendance'}>
                        Mark Attendance
                    </button>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/leaves'}>
                        Manage Leaves
                    </button>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/reports'}>
                        View Reports
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
