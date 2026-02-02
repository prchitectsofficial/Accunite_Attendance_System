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
                employeeAPI.getAll().catch((err) => {
                    console.error('Error loading employees:', err);
                    return { data: { success: false, count: 0, data: [] } };
                }),
                freelancerAPI.getAll().catch((err) => {
                    console.error('Error loading freelancers:', err);
                    return { data: { success: false, count: 0, data: [] } };
                }),
                reportAPI.getDailyReport(today).catch((err) => {
                    console.error('Error loading daily report:', err);
                    return { data: { summary: { present: 0, on_leave: 0 } } };
                })
            ]);

            // Debug logging - log full response structure
            console.log('=== Dashboard API Responses ===');
            console.log('Employees Response:', JSON.stringify(employeesRes, null, 2));
            console.log('Freelancers Response:', JSON.stringify(freelancersRes, null, 2));
            console.log('Daily Report Response:', JSON.stringify(dailyReportRes, null, 2));

            // Extract employee count - API returns: { success: true, count: X, data: [...] }
            let employeeCount = 0;
            try {
                if (employeesRes && employeesRes.data) {
                    if (typeof employeesRes.data.count === 'number') {
                        employeeCount = employeesRes.data.count;
                    } else if (Array.isArray(employeesRes.data.data)) {
                        employeeCount = employeesRes.data.data.length;
                    } else if (Array.isArray(employeesRes.data)) {
                        employeeCount = employeesRes.data.length;
                    }
                }
            } catch (e) {
                console.error('Error parsing employee count:', e);
            }
            console.log('✅ Employee Count:', employeeCount);

            // Extract freelancer count - API returns: { success: true, count: X, data: [...] }
            let freelancerCount = 0;
            try {
                if (freelancersRes && freelancersRes.data) {
                    if (typeof freelancersRes.data.count === 'number') {
                        freelancerCount = freelancersRes.data.count;
                    } else if (Array.isArray(freelancersRes.data.data)) {
                        freelancerCount = freelancersRes.data.data.length;
                    } else if (Array.isArray(freelancersRes.data)) {
                        freelancerCount = freelancersRes.data.length;
                    }
                }
            } catch (e) {
                console.error('Error parsing freelancer count:', e);
            }
            console.log('✅ Freelancer Count:', freelancerCount);

            // Extract present and leave counts from daily report
            // API returns: { success: true, data: { date, summary: { present, on_leave }, ... } }
            let presentCount = 0;
            let leaveCount = 0;
            try {
                if (dailyReportRes && dailyReportRes.data) {
                    // Try multiple paths to find summary
                    const summary = dailyReportRes.data.summary 
                        || dailyReportRes.data.data?.summary
                        || (dailyReportRes.data.data && dailyReportRes.data.data.summary);
                    
                    if (summary) {
                        presentCount = Number(summary.present) || 0;
                        leaveCount = Number(summary.on_leave || summary.onLeave) || 0;
                    }
                }
            } catch (e) {
                console.error('Error parsing daily report:', e);
            }
            console.log('✅ Present Count:', presentCount, 'Leave Count:', leaveCount);

            console.log('=== Final Stats ===', { employeeCount, freelancerCount, presentCount, leaveCount });

            setStats({
                totalEmployees: employeeCount,
                totalFreelancers: freelancerCount,
                presentToday: presentCount,
                onLeaveToday: leaveCount
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
            console.error('Error details:', error.response || error);
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
                        {stats.totalEmployees || 0}
                    </div>
                </div>

                <div className="card">
                    <h3>Total Freelancers</h3>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#17a2b8', marginTop: '10px' }}>
                        {stats.totalFreelancers || 0}
                    </div>
                </div>

                <div className="card">
                    <h3>Present Today</h3>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745', marginTop: '10px' }}>
                        {stats.presentToday || 0}
                    </div>
                </div>

                <div className="card">
                    <h3>On Leave Today</h3>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffc107', marginTop: '10px' }}>
                        {stats.onLeaveToday || 0}
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
