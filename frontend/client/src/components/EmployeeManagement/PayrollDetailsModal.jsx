import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaIdCard, FaCalendarAlt, FaDollarSign, FaCreditCard, FaClock, FaBuilding, FaCheck, FaSpinner } from 'react-icons/fa';

export default function PayrollDetailsModal({ payroll, onClose }) {
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (payroll && payroll.employee && payroll.month && payroll.year) {
      fetchAttendance();
    }
  }, [payroll]);

  const fetchAttendance = async () => {
    if (!payroll || !payroll.employee || !payroll.month || !payroll.year) return;

    setLoadingAttendance(true);
    try {
      const token = localStorage.getItem('token');
      const employeeId = typeof payroll.employee === 'object' 
        ? payroll.employee._id 
        : payroll.employee;

      // Calculate start and end dates for the payroll month
      const startDate = new Date(parseInt(payroll.year), parseInt(payroll.month) - 1, 1);
      const endDate = new Date(parseInt(payroll.year), parseInt(payroll.month), 0);

      const attendanceResponse = await fetch(
        `http://localhost:7000/api/attendance/employee/${employeeId}?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
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
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  if (!payroll) return null;


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return `Rs. ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'Bank Transfer': return <FaCreditCard className="text-blue-500" />;
      case 'Cash': return <FaDollarSign className="text-green-500" />;
      case 'Cheque': return <FaCreditCard className="text-purple-500" />;
      default: return <FaCreditCard className="text-gray-500" />;
    }
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half-day': return 'bg-orange-100 text-orange-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAttendanceStats = () => {
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const halfDay = attendance.filter(a => a.status === 'half-day').length;
    const leave = attendance.filter(a => a.status === 'leave').length;
    const total = attendance.length;
    const presentRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    return { present, absent, late, halfDay, leave, total, presentRate };
  };

  const attendanceStats = calculateAttendanceStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Payroll Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Employee Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-500" />
              Employee Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FaUser className="mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Employee Name</p>
                    <p className="font-medium text-gray-900">
                      {payroll.employee?.firstName && payroll.employee?.lastName
                        ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
                        : payroll.employee?.email || 'N/A'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaIdCard className="mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-medium text-gray-900">
                      {payroll.employee?.employeeId || payroll.employee?._id || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaCreditCard className="mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium text-gray-900">
                      {payroll.employee?.bankDetails?.accountNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaDollarSign className="mr-2 text-green-500" />
              Payroll Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Salary Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Salary Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Salary:</span>
                    <span className="font-medium">{formatCurrency(payroll.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowances:</span>
                    <span className="font-medium text-green-600">+{formatCurrency(payroll.allowances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deductions:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(payroll.deductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime:</span>
                    <span className="font-medium text-blue-600">+{formatCurrency(payroll.overtimeAmount)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-800">Net Salary:</span>
                    <span className="text-green-600">{formatCurrency(payroll.netSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Payment Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salary Number:</span>
                    <span className="font-medium">{payroll.salaryNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium">{payroll.month}/{payroll.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium">{formatDate(payroll.paymentDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Method:</span>
                    <div className="flex items-center">
                      {getPaymentMethodIcon(payroll.paymentMethod)}
                      <span className="ml-2 font-medium">{payroll.paymentMethod || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payroll.paymentStatus)}`}>
                      {payroll.paymentStatus || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Working Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaClock className="mr-2 text-purple-500" />
              Working Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Working Days</p>
                  <p className="text-2xl font-bold text-blue-600">{payroll.workingDays || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-2xl font-bold text-gray-600">{payroll.totalDays || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Overtime Hours</p>
                  <p className="text-2xl font-bold text-orange-600">{payroll.overtimeHours || '0'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {payroll.employee?.bankDetails && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaCreditCard className="mr-2 text-green-500" />
                Bank Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <FaCreditCard className="mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Account Number</p>
                      <p className="font-medium text-gray-900">
                        {payroll.employee.bankDetails.accountNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaBuilding className="mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Bank Name</p>
                      <p className="font-medium text-gray-900">
                        {payroll.employee.bankDetails.bankName || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaIdCard className="mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Branch Code</p>
                      <p className="font-medium text-gray-900">
                        {payroll.employee.bankDetails.branchCode || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaClock className="mr-2 text-purple-500" />
              Attendance for {payroll.month}/{payroll.year}
            </h3>
            
            {loadingAttendance ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FaSpinner className="animate-spin text-2xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading attendance data...</p>
              </div>
            ) : (
              <>
                {/* Attendance Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Days</p>
                      <p className="text-xl font-bold text-gray-900">{attendanceStats.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Present</p>
                      <p className="text-xl font-bold text-green-600">{attendanceStats.present}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Absent</p>
                      <p className="text-xl font-bold text-red-600">{attendanceStats.absent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Leave</p>
                      <p className="text-xl font-bold text-blue-600">{attendanceStats.leave}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Late</p>
                      <p className="text-xl font-bold text-yellow-600">{attendanceStats.late}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Present Rate</p>
                      <p className="text-xl font-bold text-purple-600">{attendanceStats.presentRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                {attendance.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <FaClock className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No attendance records found for this period</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check In
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check Out
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Working Hours
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendance.map((record) => (
                            <tr key={record._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceStatusColor(record.status)}`}>
                                  {record.status?.charAt(0).toUpperCase() + record.status?.slice(1).replace('-', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                }) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                }) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {record.workingHours ? `${record.workingHours.toFixed(1)}h` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Warehouse Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaBuilding className="mr-2 text-indigo-500" />
              Warehouse Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <FaBuilding className="mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Assigned Warehouse</p>
                  <p className="font-medium text-gray-900">
                    {payroll.employee?.warehouse?.name || 'Not Assigned'}
                  </p>
                  {payroll.employee?.warehouse?.location && (
                    <p className="text-sm text-gray-500">{payroll.employee.warehouse.location}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
