import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaBriefcase, FaCalendar, FaSave, FaSpinner, FaSearch, FaFilter } from 'react-icons/fa';

export default function BulkAttendanceMarking() {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { employeeId: status }
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Helper function to get current date - always returns today's date
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Fetch employees and existing attendance on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter employees based on search and department
  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const currentDate = getCurrentDate(); // Always use current date
      
      // Fetch all employees
      const employeesResponse = await fetch('http://localhost:7000/api/employees/all?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!employeesResponse.ok) throw new Error('Failed to fetch employees');
      
      const employeesData = await employeesResponse.json();
      if (employeesData.success) {
        const empList = employeesData.data || [];
        setEmployees(empList);
        
        // Extract unique departments
        const depts = [...new Set(empList.map(emp => emp.department))].sort();
        setDepartments(depts);
      }

      // Fetch existing attendance for today's date
      const attendanceResponse = await fetch(`http://localhost:7000/api/attendance/date/${currentDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (attendanceResponse.ok) {
        const attendanceResult = await attendanceResponse.json();
        if (attendanceResult.success) {
          const attendanceMap = {};
          attendanceResult.data.forEach(record => {
            attendanceMap[record.employee._id] = record.status;
          });
          setAttendanceData(attendanceMap);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (employeeId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: status
    }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare attendance records
      const attendanceRecords = Object.entries(attendanceData).map(([employeeId, status]) => ({
        employeeId,
        status
      }));

      if (attendanceRecords.length === 0) {
        setError('Please mark attendance for at least one employee');
        setSaving(false);
        return;
      }

      const response = await fetch('http://localhost:7000/api/attendance/bulk-mark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: getCurrentDate(), // Always use current date
          attendanceRecords
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Attendance marked successfully! ${result.data.created.length} created, ${result.data.updated.length} updated.`);
        // Refresh data to show updated statuses
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        setError(result.message || 'Failed to save attendance');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusButtonClass = (employeeId, status, targetStatus) => {
    const isSelected = attendanceData[employeeId] === targetStatus;
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2";
    
    if (targetStatus === 'present') {
      return `${baseClasses} ${isSelected 
        ? 'bg-green-600 text-white shadow-lg transform scale-105' 
        : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200'}`;
    } else if (targetStatus === 'absent') {
      return `${baseClasses} ${isSelected 
        ? 'bg-red-600 text-white shadow-lg transform scale-105' 
        : 'bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-200'}`;
    } else if (targetStatus === 'leave') {
      return `${baseClasses} ${isSelected 
        ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200'}`;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      present: 0,
      absent: 0,
      leave: 0,
      unmarked: 0
    };

    filteredEmployees.forEach(emp => {
      const status = attendanceData[emp._id];
      if (status === 'present') counts.present++;
      else if (status === 'absent') counts.absent++;
      else if (status === 'leave') counts.leave++;
      else counts.unmarked++;
    });

    return counts;
  };

  const counts = getStatusCounts();
  const hasChanges = Object.keys(attendanceData).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bulk Attendance Marking</h2>
            <p className="text-gray-600">Mark attendance for all employees at once</p>
          </div>
          
          {/* Date Display (Current Date - Read Only) */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <FaCalendar className="text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Today's Date:</label>
              <input
                type="date"
                value={getCurrentDate()}
                disabled
                readOnly
                className="px-3 py-1 border border-blue-200 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                title="Today's date (cannot be changed)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{counts.present}</p>
            </div>
            <FaCheck className="text-2xl text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{counts.absent}</p>
            </div>
            <FaTimes className="text-2xl text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Leave</p>
              <p className="text-2xl font-bold text-blue-600">{counts.leave}</p>
            </div>
            <FaBriefcase className="text-2xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unmarked</p>
              <p className="text-2xl font-bold text-gray-600">{counts.unmarked}</p>
            </div>
            <FaCalendar className="text-2xl text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave />
                  <span>Save Attendance</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const currentStatus = attendanceData[employee._id] || null;
                  return (
                    <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                              {employee.firstName?.charAt(0) || 'E'}{employee.lastName?.charAt(0) || ''}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {employee.department || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleStatusChange(employee._id, 'present')}
                            className={getStatusButtonClass(employee._id, currentStatus, 'present')}
                            title="Mark as Present"
                          >
                            <FaCheck />
                            <span>Present</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange(employee._id, 'absent')}
                            className={getStatusButtonClass(employee._id, currentStatus, 'absent')}
                            title="Mark as Absent"
                          >
                            <FaTimes />
                            <span>Absent</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange(employee._id, 'leave')}
                            className={getStatusButtonClass(employee._id, currentStatus, 'leave')}
                            title="Mark as Leave"
                          >
                            <FaBriefcase />
                            <span>Leave</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Save Button (for mobile) */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 md:hidden z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Attendance ({Object.keys(attendanceData).length} employees)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

