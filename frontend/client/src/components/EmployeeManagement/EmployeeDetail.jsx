import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBriefcase, FaDollarSign, FaCalendarAlt, FaIdCard, FaBuilding, FaClock, FaMoneyBillWave, FaSpinner } from 'react-icons/fa';

export default function EmployeeDetail({ employeeId, onClose, onEdit }) {
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not logged in. Please log in first.');
        setLoading(false);
        return;
      }

      // Fetch employee details
      const employeeResponse = await fetch(`http://localhost:7000/api/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!employeeResponse.ok) {
        throw new Error('Failed to fetch employee details');
      }

      const employeeData = await employeeResponse.json();
      if (employeeData.success) {
        setEmployee(employeeData.data);
      } else {
        throw new Error(employeeData.message || 'Failed to fetch employee');
      }

      // Fetch recent attendance (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const attendanceResponse = await fetch(
        `http://localhost:7000/api/attendance/employee/${employeeId}?startDate=${thirtyDaysAgo.toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        if (attendanceData.success) {
          setAttendance(attendanceData.data || []);
        }
      }

      // Fetch recent payroll (last 12 months)
      // Note: The API doesn't support employee filter directly, so we'll fetch and filter
      const payrollResponse = await fetch(
        `http://localhost:7000/api/financial/salaries?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (payrollResponse.ok) {
        const payrollData = await payrollResponse.json();
        if (payrollData.salaries) {
          // Filter salaries for this employee and sort by date (most recent first)
          const employeePayroll = payrollData.salaries
            .filter(salary => {
              const empId = typeof salary.employee === 'object' 
                ? salary.employee._id 
                : salary.employee;
              return empId === employeeId || empId?.toString() === employeeId?.toString();
            })
            .sort((a, b) => {
              // Sort by year and month descending
              if (b.year !== a.year) return b.year - a.year;
              return b.month - a.month;
            })
            .slice(0, 12); // Get last 12 records
          setPayroll(employeePayroll);
        }
      }

    } catch (error) {
      console.error('Error fetching employee details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'terminated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentColor = (department) => {
    switch (department) {
      case 'Production': return 'bg-blue-100 text-blue-800';
      case 'Warehouse': return 'bg-green-100 text-green-800';
      case 'Sales': return 'bg-purple-100 text-purple-800';
      case 'Finance': return 'bg-yellow-100 text-yellow-800';
      case 'HR': return 'bg-pink-100 text-pink-800';
      case 'IT': return 'bg-indigo-100 text-indigo-800';
      case 'Maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half-day': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAttendanceStats = () => {
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const halfDay = attendance.filter(a => a.status === 'half-day').length;
    const total = attendance.length;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    return { present, absent, late, halfDay, total, attendanceRate };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error || 'Employee not found'}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const attendanceStats = calculateAttendanceStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-gray-600">{employee.employeeId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {onEdit && (
              <button
                onClick={() => onEdit(employee)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payroll'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payroll History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status and Department */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status?.charAt(0).toUpperCase() + employee.status?.slice(1)}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Department</div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDepartmentColor(employee.department)}`}>
                    {employee.department}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Position</div>
                  <div className="text-sm font-medium text-gray-900">{employee.position}</div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaUser className="mr-2 text-blue-500" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <div className="flex items-center text-gray-900">
                      <FaEnvelope className="mr-2 text-gray-400" />
                      {employee.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Phone</div>
                    <div className="flex items-center text-gray-900">
                      <FaPhone className="mr-2 text-gray-400" />
                      {employee.phone}
                    </div>
                  </div>
                  {employee.cnic && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">CNIC</div>
                      <div className="flex items-center text-gray-900">
                        <FaIdCard className="mr-2 text-gray-400" />
                        {employee.cnic}
                      </div>
                    </div>
                  )}
                  {employee.address && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Address</div>
                      <div className="flex items-start text-gray-900">
                        <FaMapMarkerAlt className="mr-2 text-gray-400 mt-1" />
                        <div>
                          {employee.address.street && <div>{employee.address.street}</div>}
                          {employee.address.city && <div>{employee.address.city}</div>}
                          {employee.address.state && <div>{employee.address.state}</div>}
                          {employee.address.country && <div>{employee.address.country}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Employment Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaBriefcase className="mr-2 text-blue-500" />
                  Employment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Hire Date</div>
                    <div className="flex items-center text-gray-900">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      {formatDate(employee.hireDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Salary</div>
                    <div className="flex items-center text-gray-900 font-semibold">
                      <FaDollarSign className="mr-2 text-gray-400" />
                      {formatCurrency(employee.salary)}
                    </div>
                  </div>
                  {employee.warehouse && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Warehouse</div>
                      <div className="flex items-center text-gray-900">
                        <FaBuilding className="mr-2 text-gray-400" />
                        {typeof employee.warehouse === 'object' 
                          ? `${employee.warehouse.name} - ${employee.warehouse.location}`
                          : 'Assigned Warehouse'
                        }
                      </div>
                    </div>
                  )}
                  {employee.monthlyAllowedLeaves !== undefined && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Monthly Allowed Leaves</div>
                      <div className="flex items-center text-gray-900">
                        <FaClock className="mr-2 text-gray-400" />
                        {employee.monthlyAllowedLeaves} days
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {employee.emergencyContact && (employee.emergencyContact.name || employee.emergencyContact.phone) && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {employee.emergencyContact.name && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Name</div>
                        <div className="text-gray-900">{employee.emergencyContact.name}</div>
                      </div>
                    )}
                    {employee.emergencyContact.relationship && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Relationship</div>
                        <div className="text-gray-900">{employee.emergencyContact.relationship}</div>
                      </div>
                    )}
                    {employee.emergencyContact.phone && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Phone</div>
                        <div className="text-gray-900">{employee.emergencyContact.phone}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Details */}
              {employee.bankDetails && (employee.bankDetails.accountNumber || employee.bankDetails.bankName) && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-blue-500" />
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {employee.bankDetails.accountNumber && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Account Number</div>
                        <div className="text-gray-900">{employee.bankDetails.accountNumber}</div>
                      </div>
                    )}
                    {employee.bankDetails.bankName && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Bank Name</div>
                        <div className="text-gray-900">{employee.bankDetails.bankName}</div>
                      </div>
                    )}
                    {employee.bankDetails.branchCode && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Branch Code</div>
                        <div className="text-gray-900">{employee.bankDetails.branchCode}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attendance Summary */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaClock className="mr-2 text-blue-500" />
                  Recent Attendance Summary (Last 30 Days)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{attendanceStats.total}</div>
                    <div className="text-sm text-gray-600">Total Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                    <div className="text-sm text-gray-600">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                    <div className="text-sm text-gray-600">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                    <div className="text-sm text-gray-600">Late</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{attendanceStats.attendanceRate}%</div>
                    <div className="text-sm text-gray-600">Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Attendance Records</h3>
                <p className="text-sm text-gray-600">Last 30 days</p>
              </div>
              {attendance.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FaClock className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attendance records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendance.map((record) => (
                        <tr key={record._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceStatusColor(record.status)}`}>
                              {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.workingHours ? `${record.workingHours.toFixed(1)}h` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payroll' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payroll History</h3>
                <p className="text-sm text-gray-600">Last 12 months</p>
              </div>
              {payroll.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FaMoneyBillWave className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No payroll records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payroll.map((record) => (
                        <tr key={record._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.month}/{record.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(record.basicSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            +{formatCurrency(record.allowances)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            -{formatCurrency(record.deductions)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(record.netSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.paymentStatus === 'Paid' 
                                ? 'bg-green-100 text-green-800'
                                : record.paymentStatus === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.paymentDate ? formatDate(record.paymentDate) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

