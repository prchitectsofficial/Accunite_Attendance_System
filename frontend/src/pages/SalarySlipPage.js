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
    
    // Set default to previous month (only previous months are allowed)
    const getPreviousMonth = () => {
        if (currentMonth === 1) {
            return { year: currentYear - 1, month: 12 };
        }
        return { year: currentYear, month: currentMonth - 1 };
    };
    
    const previousMonth = getPreviousMonth();
    const [selectedYear, setSelectedYear] = useState(previousMonth.year);
    const [selectedMonth, setSelectedMonth] = useState(previousMonth.month);
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
        
        // Prevent selecting current month and future months - only previous months allowed
        if (selectedYear > currentYear || 
            (selectedYear === currentYear && newMonth >= currentMonth)) {
            showMessage('error', 'Can only view salary slip for previous months');
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
        
        // Prevent selecting current month and future months - only previous months allowed
        if (newYear > currentYear || 
            (newYear === currentYear && selectedMonth >= currentMonth)) {
            showMessage('error', 'Can only view salary slip for previous months');
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
        
        // Set PDF filename: {Emp Name} salary slip {Month}
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[selectedMonth - 1] || 'Unknown';
        const employeeName = salarySlipData.employee_name || 'Employee';
        const filename = `${employeeName} salary slip ${monthName}`;
        
        // Set document title for PDF filename
        printWindow.document.title = filename;
        
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
        const employeeName = data.employee_name || 'Employee';
        const documentTitle = `${employeeName} salary slip ${monthName}`;
        
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
    <title>${documentTitle}</title>
    <style>
        @media print { 
            body { margin: 0; padding: 0; }
            @page { margin: 0.5cm; size: A4; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Arial', 'Helvetica', sans-serif; 
            margin: 0;
            padding: 20px;
            color: #000;
            background: #fff;
            font-size: 12px;
            line-height: 1.6;
        }
        .header { 
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #fff; 
            padding: 30px 20px; 
            text-align: center;
            margin-bottom: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header h1 { 
            margin: 0 0 15px 0; 
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 1.5px;
        }
        .header p { 
            margin: 6px 0; 
            font-size: 12px;
            line-height: 1.8;
        }
        .payslip-title { 
            text-align: center; 
            margin: 30px 0; 
            font-size: 22px; 
            font-weight: bold;
            color: #1e3c72;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 10px;
            background: #f0f4ff;
            border-radius: 5px;
        }
        .employee-details { 
            display: table;
            width: 100%;
            margin-bottom: 25px;
            border-collapse: collapse;
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
        }
        .employee-details-row {
            display: table-row;
        }
        .left-column, .right-column { 
            display: table-cell;
            width: 50%;
            padding: 20px;
            vertical-align: top;
            border-right: 1px solid #e0e0e0;
        }
        .right-column {
            border-right: none;
        }
        .detail-row { 
            margin-bottom: 12px; 
            font-size: 13px;
            line-height: 1.8;
            display: table-row;
        }
        .detail-label { 
            font-weight: 600; 
            display: table-cell;
            width: 200px;
            padding: 8px 10px 8px 0;
            color: #333;
            vertical-align: top;
        }
        .detail-value {
            display: table-cell;
            padding: 8px 0;
            color: #000;
            vertical-align: top;
        }
        .salary-table-container {
            margin-top: 25px;
            display: flex;
            gap: 20px;
        }
        .earnings, .deductions { 
            flex: 1;
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
        }
        .section-title { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            font-weight: bold; 
            font-size: 16px; 
            padding: 15px 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
        }
        .table-content {
            padding: 15px 20px;
        }
        .amount-row { 
            display: table-row;
            border-bottom: 1px solid #f0f0f0;
        }
        .amount-row:last-child {
            border-bottom: none;
        }
        .amount-label { 
            display: table-cell;
            font-weight: 500;
            color: #333;
            padding: 10px 15px 10px 0;
            font-size: 13px;
        }
        .amount-value { 
            display: table-cell;
            text-align: right;
            font-weight: 600;
            color: #000;
            font-family: 'Courier New', monospace;
            padding: 10px 0;
            font-size: 13px;
        }
        .total-row { 
            border-top: 3px solid #667eea; 
            background: #f8f9ff;
            margin-top: 10px;
        }
        .total-row .amount-label,
        .total-row .amount-value {
            font-size: 15px;
            font-weight: bold;
            color: #1e3c72;
            padding: 12px 15px 12px 0;
        }
        .total-row .amount-value {
            padding: 12px 0;
        }
        .in-words-row {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
            background: #fffbf0;
        }
        .in-words-row .amount-label {
            font-weight: 600;
            color: #333;
        }
        .in-words-row .amount-value {
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
            color: #d97706;
        }
        .footer { 
            margin-top: 40px; 
            font-size: 11px; 
            color: #666;
            text-align: center;
            font-style: italic;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            border-top: 2px solid #e0e0e0;
        }
        .summary-box {
            margin-top: 20px;
            padding: 15px;
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            border-radius: 5px;
        }
        .summary-row {
            display: table-row;
            font-size: 12px;
        }
        .summary-label {
            display: table-cell;
            font-weight: 600;
            padding: 5px 15px 5px 0;
            color: #555;
        }
        .summary-value {
            display: table-cell;
            color: #000;
            padding: 5px 0;
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
    <table class="employee-details-table" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
            <tr>
                <th colspan="2" style="background-color: #1e3c72; color: #fff; padding: 12px; text-align: center; font-size: 14px; font-weight: bold;">Employee Details</th>
                <th colspan="2" style="background-color: #1e3c72; color: #fff; padding: 12px; text-align: center; font-size: 14px; font-weight: bold;">Bank & Statutory Details</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 25%;">Group/Company:</td>
                <td style="border: 1px solid #ddd; padding: 10px; width: 25%;">Accunite Solutions PVT.LTD.</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; width: 25%;">Bank Name:</td>
                <td style="border: 1px solid #ddd; padding: 10px; width: 25%;">${data.bank_name || '-'}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Employee Name:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.employee_name || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">IFSC:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.ifsc || '-'}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Employee Code:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.employee_code || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Bank Account Number:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.bank_account_number || '-'}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Employee Designation:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.designation || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Aadhaar Number:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.aadhaar_number || '-'}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Date of Joining:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.date_of_joining ? new Date(data.date_of_joining).toLocaleDateString('en-IN') : '-'}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Permanent Account Number:</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${data.pan || '-'}</td>
            </tr>
        </tbody>
    </table>
    <div class="salary-table-container">
        <div class="earnings">
            <div class="section-title">EARNINGS</div>
            <div class="table-content">
                <div style="display: table; width: 100%;">
                    <div class="amount-row">
                        <span class="amount-label">BASIC:</span>
                        <span class="amount-value">₹${(data.basic || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="amount-row">
                        <span class="amount-label">CONVEYANCE:</span>
                        <span class="amount-value">₹${(data.conveyance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="amount-row">
                        <span class="amount-label">HOUSE RENT ALLOWANCE:</span>
                        <span class="amount-value">₹${(data.house_rent_allowance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="amount-row">
                        <span class="amount-label">PERSONAL ALLOWANCE:</span>
                        <span class="amount-value">₹${(data.personal_allowance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="amount-row total-row">
                        <span class="amount-label">Total Earning:</span>
                        <span class="amount-value">₹${(data.total_earning || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="amount-row total-row">
                        <span class="amount-label">NET SALARY:</span>
                        <span class="amount-value">₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="amount-row in-words-row">
                        <span class="amount-label">IN WORDS:</span>
                        <span class="amount-value">${netSalaryWords}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="deductions">
            <div class="section-title">DEDUCTIONS</div>
            <div class="table-content">
                <div style="display: table; width: 100%;">
                    <div class="amount-row">
                        <span class="amount-label">Leaves Taken:</span>
                        <span class="amount-value">${data.paid_leave || 0} days</span>
                    </div>
                    <div class="amount-row">
                        <span class="amount-label">Remaining Leaves:</span>
                        <span class="amount-value">${data.leave_remaining || 0} days</span>
                    </div>
                </div>
            </div>
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
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const year = new Date().getFullYear() - i;
                                            const currentDate = new Date();
                                            const currentYear = currentDate.getFullYear();
                                            const currentMonth = currentDate.getMonth() + 1;
                                            // Disable current year if current month is selected, or future years
                                            const isDisabled = year > currentYear || 
                                                (year === currentYear && selectedMonth >= currentMonth);
                                            return (
                                                <option key={year} value={year} disabled={isDisabled}>
                                                    {year} {isDisabled ? '(Not Available)' : ''}
                                                </option>
                                            );
                                        })}
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
                                                // Disable current month and future months - only previous months allowed
                                                const isCurrentOrFuture = selectedYear > currentYear || 
                                                    (selectedYear === currentYear && month.value >= currentMonth);
                                                return (
                                                    <option 
                                                        key={month.value} 
                                                        value={month.value}
                                                        disabled={isCurrentOrFuture}
                                                    >
                                                        {month.label} {isCurrentOrFuture ? '(Not Available)' : ''}
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
