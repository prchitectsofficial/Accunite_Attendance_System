import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';

function SalarySlipPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [salarySlipData, setSalarySlipData] = useState(null);
    const [loadingSlip, setLoadingSlip] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        // Get logged-in user from localStorage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                
                // If employee, auto-select themselves
                if (user && user.employee_code && user.role === 'employee') {
                    loadEmployeeData(user.employee_code);
                } else if (user && (user.role === 'admin' || user.admin_id)) {
                    // If admin, load all employees
                    loadEmployees();
                }
            }
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadEmployees = async () => {
        try {
            const response = await employeeAPI.getAll();
            setEmployees(response.data.data || []);
        } catch (error) {
            showMessage('error', 'Failed to load employees');
        }
    };

    const loadEmployeeData = async (employeeCode) => {
        try {
            const response = await employeeAPI.getById(employeeCode);
            const employee = response.data.data;
            setSelectedEmployee(employee);
            setEmployees([employee]);
            // Load salary slip for current month
            loadSalarySlip(employeeCode, selectedYear, selectedMonth);
        } catch (error) {
            showMessage('error', 'Failed to load employee data');
        }
    };

    const handleEmployeeSelect = (employee) => {
        setSelectedEmployee(employee);
        setSalarySlipData(null);
        loadSalarySlip(employee.employee_code, selectedYear, selectedMonth);
    };

    const loadSalarySlip = async (employeeCode, year, month) => {
        setLoadingSlip(true);
        try {
            const response = await employeeAPI.getSalarySlip(employeeCode, year, month);
            setSalarySlipData(response.data.data);
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to load salary slip');
            setSalarySlipData(null);
        } finally {
            setLoadingSlip(false);
        }
    };

    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Prevent selecting future months
        if (selectedYear > currentYear || (selectedYear === currentYear && newMonth > currentMonth)) {
            showMessage('error', 'Cannot view salary slip for future months');
            return;
        }
        
        setSelectedMonth(newMonth);
        if (selectedEmployee) {
            loadSalarySlip(selectedEmployee.employee_code, selectedYear, newMonth);
        }
    };

    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Prevent selecting future years or future months in current year
        if (newYear > currentYear || (newYear === currentYear && selectedMonth > currentMonth)) {
            showMessage('error', 'Cannot view salary slip for future months');
            return;
        }
        
        setSelectedYear(newYear);
        if (selectedEmployee) {
            loadSalarySlip(selectedEmployee.employee_code, newYear, selectedMonth);
        }
    };

    const handleDownloadSalarySlip = () => {
        if (!salarySlipData) return;
        
        // Create HTML content for PDF
        const htmlContent = generateSalarySlipHTML(salarySlipData);
        
        // Create a new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const generateSalarySlipHTML = (data) => {
        if (!data) return '';
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[selectedMonth - 1] || 'Unknown';
        
        const numberToWords = (num) => {
            if (!num || isNaN(num) || num < 0) return 'ZERO';
            num = Math.floor(num);
            
            const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 
                         'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 
                         'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
            const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
            
            if (num === 0) return 'ZERO';
            if (num < 20) return ones[num] || 'ZERO';
            if (num < 100) {
                const ten = Math.floor(num / 10);
                const one = num % 10;
                return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
            }
            if (num < 1000) {
                const hundred = Math.floor(num / 100);
                const remainder = num % 100;
                return ones[hundred] + ' HUNDRED' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
            }
            if (num < 100000) {
                const thousand = Math.floor(num / 1000);
                const remainder = num % 1000;
                return numberToWords(thousand) + ' THOUSAND' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
            }
            if (num < 10000000) {
                const lakh = Math.floor(num / 100000);
                const remainder = num % 100000;
                return numberToWords(lakh) + ' LAKH' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
            }
            return 'LARGE AMOUNT';
        };
        
        const netSalary = data.net_salary || 0;
        const wordsResult = numberToWords(Math.floor(netSalary));
        const netSalaryWords = (wordsResult || 'ZERO').toString().replace(/\s+/g, ' ').trim() + ' ONLY';
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Salary Slip - ${data.employee_name}</title>
    <style>
        @media print { 
            body { margin: 0; padding: 0; }
            @page { margin: 0.5cm; size: A4; }
        }
        * { box-sizing: border-box; }
        body { 
            font-family: 'Arial', 'Helvetica', sans-serif; 
            margin: 0;
            padding: 15px;
            color: #000;
            background: #fff;
            font-size: 12px;
            line-height: 1.5;
        }
        .header { 
            background-color: #000; 
            color: #fff; 
            padding: 25px 20px; 
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 { 
            margin: 0 0 12px 0; 
            font-size: 26px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .header p { 
            margin: 4px 0; 
            font-size: 11px;
            line-height: 1.6;
        }
        .payslip-title { 
            text-align: center; 
            margin: 25px 0; 
            font-size: 20px; 
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .employee-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 25px;
            padding: 15px;
            background: #f9f9f9;
            border: 1px solid #ddd;
        }
        .left-column, .right-column { 
            width: 48%;
            padding: 0 10px;
        }
        .detail-row { 
            margin-bottom: 10px; 
            font-size: 13px;
            line-height: 1.7;
            display: flex;
            align-items: flex-start;
        }
        .detail-label { 
            font-weight: bold; 
            display: inline-block; 
            width: 180px;
            min-width: 180px;
            color: #333;
        }
        .detail-value {
            flex: 1;
            color: #000;
        }
        .earnings-deductions { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 25px;
            gap: 20px;
        }
        .earnings, .deductions { 
            width: 48%;
            padding: 15px;
            background: #f9f9f9;
            border: 1px solid #ddd;
        }
        .section-title { 
            color: #0066cc; 
            font-weight: bold; 
            font-size: 16px; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #0066cc; 
            padding-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .amount-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            font-size: 13px;
            padding: 4px 0;
            align-items: center;
        }
        .amount-label { 
            font-weight: 600;
            color: #333;
        }
        .amount-value { 
            text-align: right;
            font-weight: 500;
            color: #000;
            font-family: 'Courier New', monospace;
        }
        .total-row { 
            border-top: 2px solid #000; 
            padding-top: 8px; 
            margin-top: 12px; 
            font-weight: bold;
            font-size: 14px;
        }
        .total-row .amount-label,
        .total-row .amount-value {
            font-size: 14px;
            font-weight: bold;
        }
        .footer { 
            margin-top: 40px; 
            font-size: 10px; 
            color: #666;
            text-align: center;
            font-style: italic;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        }
        .in-words-row {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 12px;
        }
        .in-words-row .amount-label {
            font-weight: 600;
        }
        .in-words-row .amount-value {
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accunite Solutions PVT.LTD.</h1>
        <p>115, Tower 1, Assotech Business Cresterra, Sector-135, Noida, IN</p>
        <p>PAN: AAMCA0390C | TAN: DELA40504C</p>
    </div>
    <div class="payslip-title">Payslip for the month of ${monthName} ${selectedYear}</div>
    <div class="employee-details">
        <div class="left-column">
            <div class="detail-row"><span class="detail-label">Group/Company:</span><span class="detail-value">Accunite Solutions PVT.LTD.</span></div>
            <div class="detail-row"><span class="detail-label">Employee Name:</span><span class="detail-value">${data.employee_name || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Employee Code:</span><span class="detail-value">${data.employee_code || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Employee Designation:</span><span class="detail-value">${data.designation || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Date of Joining:</span><span class="detail-value">${data.date_of_joining || '-'}</span></div>
        </div>
        <div class="right-column">
            <div class="detail-row"><span class="detail-label">Bank Name:</span><span class="detail-value">${data.bank_name || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">IFSC:</span><span class="detail-value">${data.ifsc || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Bank Account Number:</span><span class="detail-value">${data.bank_account_number || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Aadhaar Number:</span><span class="detail-value">${data.aadhaar_number || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Permanent Account Number:</span><span class="detail-value">${data.pan || '-'}</span></div>
        </div>
    </div>
    <div class="earnings-deductions">
        <div class="earnings">
            <div class="section-title">EARNINGS</div>
            <div class="amount-row"><span class="amount-label">BASIC:</span><span class="amount-value">₹${(data.basic || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="amount-row"><span class="amount-label">CONVEYANCE:</span><span class="amount-value">₹${(data.conveyance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="amount-row"><span class="amount-label">HOUSE RENT ALLOWANCE:</span><span class="amount-value">₹${(data.house_rent_allowance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="amount-row"><span class="amount-label">PERSONAL ALLOWANCE:</span><span class="amount-value">₹${(data.personal_allowance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="amount-row total-row"><span class="amount-label">Total Earning:</span><span class="amount-value">₹${(data.total_earning || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="amount-row total-row"><span class="amount-label">NET SALARY:</span><span class="amount-value">₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="amount-row in-words-row"><span class="amount-label">IN WORDS:</span><span class="amount-value">${netSalaryWords}</span></div>
        </div>
        <div class="deductions">
            <div class="section-title">DEDUCTIONS</div>
            <div class="amount-row"><span class="amount-label">Paid Leave:</span><span class="amount-value">${data.paid_leave || 0}</span></div>
            <div class="amount-row"><span class="amount-label">UnPaid Leave:</span><span class="amount-value">${data.unpaid_leave || 0}</span></div>
            <div class="amount-row total-row"><span class="amount-label">Total Deduction:</span><span class="amount-value">₹${(data.total_deduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="amount-row" style="margin-top: 15px;"><span class="amount-label">Leave Remaining (incl. earned):</span><span class="amount-value">${data.leave_remaining || 0}</span></div>
            <div class="amount-row"><span class="amount-label">Leave Allotted:</span><span class="amount-value">${data.leave_allotted || 0}</span></div>
        </div>
    </div>
    <div class="footer">This is Computer Generated Payslip, does not need signatures.</div>
</body>
</html>`;
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.admin_id);

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Salary Slip</h1>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Employee Selection (Admin only) */}
                {isAdmin && (
                    <div className="card" style={{ width: '300px', flexShrink: 0 }}>
                        <h3>Select Employee</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {employees.map(emp => (
                                <div
                                    key={emp.employee_code}
                                    onClick={() => handleEmployeeSelect(emp)}
                                    style={{
                                        padding: '10px',
                                        marginBottom: '5px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedEmployee?.employee_code === emp.employee_code ? '#e3f2fd' : '#f5f5f5',
                                        border: selectedEmployee?.employee_code === emp.employee_code ? '2px solid #2196f3' : '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{emp.employee_code}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Salary Slip Display */}
                <div className="card" style={{ flex: 1 }}>
                    {!selectedEmployee ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {isAdmin ? 'Please select an employee to view salary slip' : 'Loading your salary slip...'}
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year:</label>
                                    <select
                                        value={selectedYear}
                                        onChange={handleYearChange}
                                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    >
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Month:</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={handleMonthChange}
                                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    >
                                        {(() => {
                                            const currentDate = new Date();
                                            const currentYear = currentDate.getFullYear();
                                            const currentMonth = currentDate.getMonth() + 1;
                                            const months = [
                                                { value: 1, label: 'January' },
                                                { value: 2, label: 'February' },
                                                { value: 3, label: 'March' },
                                                { value: 4, label: 'April' },
                                                { value: 5, label: 'May' },
                                                { value: 6, label: 'June' },
                                                { value: 7, label: 'July' },
                                                { value: 8, label: 'August' },
                                                { value: 9, label: 'September' },
                                                { value: 10, label: 'October' },
                                                { value: 11, label: 'November' },
                                                { value: 12, label: 'December' }
                                            ];
                                            return months.map(month => {
                                                const isFuture = selectedYear > currentYear || (selectedYear === currentYear && month.value > currentMonth);
                                                return (
                                                    <option 
                                                        key={month.value} 
                                                        value={month.value}
                                                        disabled={isFuture}
                                                    >
                                                        {month.label} {isFuture ? '(Future)' : ''}
                                                    </option>
                                                );
                                            });
                                        })()}
                                    </select>
                                </div>
                                <div style={{ marginTop: '25px' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleDownloadSalarySlip}
                                        disabled={!salarySlipData || loadingSlip}
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                            
                            {loadingSlip ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>Loading salary slip...</div>
                            ) : salarySlipData ? (
                                <div id="salary-slip-content" style={{ border: '1px solid #ddd', padding: '20px', backgroundColor: '#fff' }}>
                                    {(() => {
                                        const htmlContent = generateSalarySlipHTML(salarySlipData);
                                        if (!htmlContent) return <div>Error generating salary slip</div>;
                                        try {
                                            const bodyContent = htmlContent.replace(/<!DOCTYPE html>[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*?<\/html>/, '');
                                            return <div dangerouslySetInnerHTML={{ __html: bodyContent }} />;
                                        } catch (error) {
                                            console.error('Error processing salary slip HTML:', error);
                                            return <div>Error displaying salary slip</div>;
                                        }
                                    })()}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    No salary slip data available for the selected month.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SalarySlipPage;
