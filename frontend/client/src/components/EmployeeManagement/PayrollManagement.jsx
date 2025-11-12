import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCalculator, FaDownload, FaPrint, FaUser, FaCalendar, FaSpinner } from 'react-icons/fa';
import PayrollDetailsModal from './PayrollDetailsModal';

export default function PayrollManagement() {
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeRate, setOvertimeRate] = useState(0);
  const [attendanceInfo, setAttendanceInfo] = useState({
    absentDays: 0,
    allowedLeaves: 0,
    excessLeaves: 0,
    leaveDeduction: 0
  });

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:7000/api/employees/all?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees: ' + error.message);
    }
  };

  const fetchAttendanceInfo = async (employeeId, year, month) => {
    if (!employeeId || !year || !month) {
      setAttendanceInfo({
        absentDays: 0,
        allowedLeaves: 0,
        excessLeaves: 0,
        leaveDeduction: 0
      });
      return;
    }

    try {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      const token = localStorage.getItem('token');
      const employee = employees.find(emp => emp._id === employeeId);
      
      if (!employee) return;

      const attendanceResponse = await fetch(
        `http://localhost:7000/api/attendance/employee/${employeeId}?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let absentDays = 0;
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        if (attendanceData.success && attendanceData.data) {
          const fullAbsent = attendanceData.data.filter(record => 
            record.status === 'absent'
          ).length;
          const halfDays = attendanceData.data.filter(record => 
            record.status === 'half-day'
          ).length;
          absentDays = fullAbsent + (halfDays * 0.5);
        }
      }

      const monthlyAllowedLeaves = employee.monthlyAllowedLeaves || 0;
      const excessLeaves = Math.max(0, absentDays - monthlyAllowedLeaves);
      const dailySalaryRate = (employee.salary || 0) / 30;
      const leaveDeduction = excessLeaves * dailySalaryRate;

      setAttendanceInfo({
        absentDays: absentDays,
        allowedLeaves: monthlyAllowedLeaves,
        excessLeaves: excessLeaves,
        leaveDeduction: leaveDeduction
      });
    } catch (error) {
      console.error('Error fetching attendance info:', error);
      setAttendanceInfo({
        absentDays: 0,
        allowedLeaves: 0,
        excessLeaves: 0,
        leaveDeduction: 0
      });
    }
  };

  const fetchPayrollData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [year, month] = selectedMonth.split('-');
      const params = new URLSearchParams({
        year,
        month,
        limit: 100
      });

      const response = await fetch(`http://localhost:7000/api/financial/salaries?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Salaries data:', data.salaries);
      
      if (data.salaries) {
        // Log each salary record to debug employee data
        data.salaries.forEach((salary, index) => {
          console.log(`Salary ${index}:`, {
            id: salary._id,
            employee: salary.employee,
            employeeData: salary.employee,
            salaryNumber: salary.salaryNumber
          });
        });
        setPayrollData(data.salaries);
      } else {
        throw new Error(data.message || 'Failed to fetch payroll data');
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      setError('Failed to load payroll data: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchEmployees(), fetchPayrollData()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  const handleGeneratePayroll = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Check if user is authenticated
      if (!token) {
        alert('You are not logged in. Please log in first.');
        window.location.href = '/login';
        return;
      }

      console.log('Sending payroll data:', formData);

      const response = await fetch('http://localhost:7000/api/financial/salaries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.salaryNumber) {
        alert('Payroll generated successfully!');
        setShowPayrollForm(false);
        fetchPayrollData(); // Refresh payroll data
      } else {
        throw new Error(data.message || 'Failed to generate payroll');
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Error generating payroll: ' + error.message);
    }
  };


  const handleMarkAsPaid = async (salaryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/financial/salaries/${salaryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentStatus: 'Paid',
          paymentDate: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.salaryNumber) {
        alert('Payroll marked as paid successfully!');
        fetchPayrollData(); // Refresh payroll data
      } else {
        throw new Error(data.message || 'Failed to update payroll');
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      alert('Error updating payroll: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalPayroll = () => {
    return payrollData.reduce((total, record) => total + (record.netSalary || 0), 0);
  };

  const getPaidCount = () => {
    return payrollData.filter(record => record.paymentStatus === 'Paid').length;
  };

  const getPendingCount = () => {
    return payrollData.filter(record => record.paymentStatus === 'Pending').length;
  };

  const handleExportPayroll = () => {
    alert('Payroll data exported successfully!');
  };

  const handlePrintPayroll = () => {
    alert('Payroll data sent to printer!');
  };

  const handleViewPayrollDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPayrollModal(true);
  };

  const handleClosePayrollModal = () => {
    setShowPayrollModal(false);
    setSelectedPayroll(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading payroll data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchEmployees();
              fetchPayrollData();
            }}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
          <p className="text-gray-600">Calculate and manage employee salaries</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPayrollForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <FaCalculator className="mr-2" />
            Generate Individual Payroll
          </button>
          <button
            onClick={handleExportPayroll}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FaDownload className="mr-2" />
            Export
          </button>
          <button
            onClick={handlePrintPayroll}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <FaPrint className="mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FaCalendar className="text-gray-500 mr-2" />
            <label className="text-sm font-medium text-gray-700">Select Month:</label>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaMoneyBillWave className="text-green-600 text-2xl mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">Total Payroll</p>
              <p className="text-2xl font-bold text-green-900">${getTotalPayroll().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaUser className="text-blue-600 text-2xl mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Paid</p>
              <p className="text-2xl font-bold text-blue-900">{getPaidCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaCalculator className="text-yellow-600 text-2xl mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{getPendingCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaMoneyBillWave className="text-purple-600 text-2xl mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-800">Average Salary</p>
              <p className="text-2xl font-bold text-purple-900">
                ${payrollData.length > 0 ? Math.round(getTotalPayroll() / payrollData.length).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overtime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollData.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {record.employee?.firstName?.charAt(0) || 'E'}{record.employee?.lastName?.charAt(0) || 'M'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee?.firstName && record.employee?.lastName 
                            ? `${record.employee.firstName} ${record.employee.lastName}`
                            : record.employee?.email || `Employee (${record.employee || 'Unknown'})`
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {record.employee?.employeeId || record.employee?._id || record.employee || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.basicSalary?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.allowances?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.deductions?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.overtimeAmount?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${record.netSalary?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.paymentStatus)}`}>
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (record.paymentStatus === 'Pending') {
                            if (window.confirm('Mark this payroll as paid?')) {
                              handleMarkAsPaid(record._id);
                            }
                          }
                        }}
                        className={`px-3 py-1 rounded text-xs ${
                          record.paymentStatus === 'Pending' 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={record.paymentStatus !== 'Pending'}
                      >
                        {record.paymentStatus === 'Pending' ? 'Mark Paid' : 'Paid'}
                      </button>
                      <button
                        onClick={() => handleViewPayrollDetails(record)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payrollData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <FaMoneyBillWave />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll records</h3>
            <p className="text-gray-500 mb-4">Generate payroll for employees</p>
            <button
              onClick={() => setShowPayrollForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Payroll
            </button>
          </div>
        )}
      </div>

      {/* Payroll Generation Form Modal */}
      {showPayrollForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Generate Payroll</h3>
                <button
                  onClick={() => {
                    setShowPayrollForm(false);
                    setAllowances(0);
                    setDeductions(0);
                    setOvertimeHours(0);
                    setOvertimeRate(0);
                    setSelectedEmployee('');
                    setAttendanceInfo({
                      absentDays: 0,
                      allowedLeaves: 0,
                      excessLeaves: 0,
                      leaveDeduction: 0
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="payroll-form" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const [year, month] = formData.get('month').split('-');
                const employee = employees.find(emp => emp._id === formData.get('employeeId'));
                
                if (!employee) {
                  alert('Please select an employee');
                  return;
                }

                try {
                  // Fetch attendance records for the month
                  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString().split('T')[0];
                  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
                  
                  const token = localStorage.getItem('token');
                  const attendanceResponse = await fetch(
                    `http://localhost:7000/api/attendance/employee/${employee._id}?startDate=${startDate}&endDate=${endDate}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  let absentDays = 0;
                  let totalDaysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                  
                  if (attendanceResponse.ok) {
                    const attendanceData = await attendanceResponse.json();
                    if (attendanceData.success && attendanceData.data) {
                      // Count absent days (full absent = 1, half-day = 0.5)
                      const fullAbsent = attendanceData.data.filter(record => 
                        record.status === 'absent'
                      ).length;
                      const halfDays = attendanceData.data.filter(record => 
                        record.status === 'half-day'
                      ).length;
                      absentDays = fullAbsent + (halfDays * 0.5);
                    }
                  }

                  // Calculate salary deductions based on leaves
                  const basicSalary = employee.salary || 0;
                  const monthlyAllowedLeaves = employee.monthlyAllowedLeaves || 0;
                  const excessLeaves = Math.max(0, absentDays - monthlyAllowedLeaves);
                  
                  // Calculate daily salary rate (assuming 30 working days per month)
                  const dailySalaryRate = basicSalary / 30;
                  const leaveDeduction = excessLeaves * dailySalaryRate;

                  // Calculate net salary using form values
                  const allowancesValue = parseFloat(allowances) || 0;
                  const deductionsValue = parseFloat(deductions) || 0;
                  const overtimeHoursValue = parseFloat(overtimeHours) || 0;
                  const overtimeRateValue = parseFloat(overtimeRate) || 0;
                  const overtimeAmount = overtimeHoursValue * overtimeRateValue;
                  
                  // Total deductions = manual deductions + leave deductions
                  const totalDeductions = deductionsValue + leaveDeduction;
                  const netSalary = basicSalary + allowancesValue + overtimeAmount - totalDeductions;
                  
                  // Calculate actual working days
                  const actualWorkingDays = totalDaysInMonth - absentDays;
                  
                  const payrollData = {
                    employee: formData.get('employeeId'),
                    month: parseInt(month),
                    year: parseInt(year),
                    basicSalary: basicSalary,
                    allowances: allowancesValue,
                    deductions: totalDeductions,
                    leaveDeduction: leaveDeduction,
                    absentDays: absentDays,
                    allowedLeaves: monthlyAllowedLeaves,
                    excessLeaves: excessLeaves,
                    overtimeHours: overtimeHoursValue,
                    overtimeRate: overtimeRateValue,
                    overtimeAmount: overtimeAmount,
                    netSalary: netSalary,
                    workingDays: actualWorkingDays,
                    totalDays: totalDaysInMonth,
                    paymentDate: new Date().toISOString().split('T')[0],
                    paymentMethod: 'Bank Transfer',
                    // Use the employee's warehouse or default to the first available warehouse
                    // In a real app, you'd have proper account management
                    salaryAccount: employee.warehouse || '68c49d0884b60adb796082ef', // Use employee's warehouse as account
                    cashAccount: employee.warehouse || '68c49d0884b60adb796082ef', // Use employee's warehouse as account
                    warehouse: employee.warehouse || '68c49d0884b60adb796082ef' // Use employee's warehouse
                  };

                  console.log('Generated payroll data:', payrollData);
                  await handleGeneratePayroll(payrollData);
                } catch (error) {
                  console.error('Error calculating payroll:', error);
                  alert('Error calculating payroll based on attendance. Please try again.');
                }
                // Reset form after successful submission
                setAllowances(0);
                setDeductions(0);
                setOvertimeHours(0);
                setOvertimeRate(0);
                setSelectedEmployee('');
                setAttendanceInfo({
                  absentDays: 0,
                  allowedLeaves: 0,
                  excessLeaves: 0,
                  leaveDeduction: 0
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Employee
                    </label>
                    <select
                      name="employeeId"
                      value={selectedEmployee}
                      onChange={(e) => {
                        setSelectedEmployee(e.target.value);
                        const [year, month] = selectedMonth.split('-');
                        if (e.target.value) {
                          fetchAttendanceInfo(e.target.value, year, month);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId}) - ${emp.salary?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <input
                      type="month"
                      name="month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        const [year, month] = e.target.value.split('-');
                        if (selectedEmployee) {
                          fetchAttendanceInfo(selectedEmployee, year, month);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowances ($)
                    </label>
                    <input
                      type="number"
                      value={allowances}
                      onChange={(e) => setAllowances(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deductions ($)
                    </label>
                    <input
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overtime Hours
                      </label>
                      <input
                        type="number"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(e.target.value)}
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overtime Rate ($/hour)
                      </label>
                      <input
                        type="number"
                        value={overtimeRate}
                        onChange={(e) => setOvertimeRate(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Attendance Info */}
                  {selectedEmployee && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-gray-900 mb-2">Attendance Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Absent Days:</span>
                          <span>{attendanceInfo.absentDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allowed Leaves:</span>
                          <span>{attendanceInfo.allowedLeaves}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Excess Leaves:</span>
                          <span className={attendanceInfo.excessLeaves > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {attendanceInfo.excessLeaves}
                          </span>
                        </div>
                        {attendanceInfo.excessLeaves > 0 && (
                          <div className="flex justify-between text-red-600 font-medium">
                            <span>Leave Deduction:</span>
                            <span>-${attendanceInfo.leaveDeduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Payroll Calculation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span>${selectedEmployee ? employees.find(emp => emp._id === selectedEmployee)?.salary?.toLocaleString() : '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowances:</span>
                        <span className="text-green-600">+${parseFloat(allowances || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {attendanceInfo.excessLeaves > 0 && (
                        <div className="flex justify-between">
                          <span>Leave Deduction ({attendanceInfo.excessLeaves} excess days):</span>
                          <span className="text-red-600">-${attendanceInfo.leaveDeduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Other Deductions:</span>
                        <span className="text-red-600">-${parseFloat(deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime ({parseFloat(overtimeHours || 0)} hrs × ${parseFloat(overtimeRate || 0).toFixed(2)}):</span>
                        <span className="text-blue-600">+${(parseFloat(overtimeHours || 0) * parseFloat(overtimeRate || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-medium">
                        <span>Net Salary:</span>
                        <span className="text-green-600">
                          ${(() => {
                            const basic = selectedEmployee ? employees.find(emp => emp._id === selectedEmployee)?.salary || 0 : 0;
                            const allow = parseFloat(allowances || 0);
                            const deduct = parseFloat(deductions || 0);
                            const overtime = parseFloat(overtimeHours || 0) * parseFloat(overtimeRate || 0);
                            const leaveDeduct = attendanceInfo.leaveDeduction || 0;
                            return (basic + allow + overtime - deduct - leaveDeduct).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                    onClick={() => {
                      setShowPayrollForm(false);
                      setAllowances(0);
                      setDeductions(0);
                      setOvertimeHours(0);
                      setOvertimeRate(0);
                      setSelectedEmployee('');
                      setAttendanceInfo({
                        absentDays: 0,
                        allowedLeaves: 0,
                        excessLeaves: 0,
                        leaveDeduction: 0
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
              <button
                type="button"
                onClick={() => {
                  const form = document.getElementById('payroll-form');
                  if (form) {
                    form.requestSubmit();
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate Payroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Details Modal */}
      {showPayrollModal && (
        <PayrollDetailsModal
          payroll={selectedPayroll}
          onClose={handleClosePayrollModal}
        />
      )}
    </div>
  );
}