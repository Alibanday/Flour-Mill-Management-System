import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaUserCheck, FaUserTimes, FaBuilding, FaWarehouse, 
  FaDollarSign, FaChartLine, FaCalendarAlt, FaUserTie, 
  FaArrowUp, FaArrowDown, FaExclamationTriangle, FaCheckCircle 
} from 'react-icons/fa';

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    terminatedEmployees: 0,
    departmentStats: [],
    warehouseStats: [],
    recentHires: [],
    salaryStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployeeStats();
  }, []);

  const fetchEmployeeStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not logged in. Please log in first.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:7000/api/employees/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        throw new Error('Failed to fetch employee statistics');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch employee statistics');
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      setError('An error occurred while fetching employee statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Dashboard</h2>
            <p className="text-gray-600">Overview of employee statistics and analytics</p>
          </div>
          <div className="flex items-center space-x-2">
            <FaChartLine className="text-blue-600 text-xl" />
            <span className="text-sm text-gray-500">Real-time Data</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeEmployees}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FaUserCheck className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        {/* Inactive Employees */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Employees</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.inactiveEmployees}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaUserTimes className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        {/* Terminated Employees */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminated</p>
              <p className="text-3xl font-bold text-red-600">{stats.terminatedEmployees}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <FaUserTimes className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaBuilding className="mr-2 text-blue-600" />
          Department Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.departmentStats.map((dept, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{dept._id}</p>
                  <p className="text-sm text-gray-600">{dept.count} employees</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {dept.avgSalary ? `Rs. ${Math.round(dept.avgSalary).toLocaleString()}` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Avg Salary</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warehouse Statistics */}
      {stats.warehouseStats && stats.warehouseStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaWarehouse className="mr-2 text-green-600" />
            Warehouse Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.warehouseStats.map((warehouse, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{warehouse.warehouseName}</p>
                    <p className="text-sm text-gray-600">{warehouse.count} employees</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FaWarehouse className="text-green-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salary Statistics */}
      {stats.salaryStats && Object.keys(stats.salaryStats).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaDollarSign className="mr-2 text-green-600" />
            Salary Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Average Salary</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.salaryStats.avgSalary ? `Rs. ${Math.round(stats.salaryStats.avgSalary).toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Minimum Salary</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.salaryStats.minSalary ? `Rs. ${Math.round(stats.salaryStats.minSalary).toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Maximum Salary</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.salaryStats.maxSalary ? `Rs. ${Math.round(stats.salaryStats.maxSalary).toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Payroll</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.salaryStats.totalSalary ? `Rs. ${Math.round(stats.salaryStats.totalSalary).toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Hires */}
      {stats.recentHires && stats.recentHires.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaCalendarAlt className="mr-2 text-purple-600" />
            Recent Hires (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {stats.recentHires.map((hire, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <FaUserTie className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {hire.firstName} {hire.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {hire.department} • {hire.position}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(hire.hireDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center text-green-600">
                    <FaCheckCircle className="text-xs mr-1" />
                    <span className="text-xs">New Hire</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <FaUsers className="text-blue-600 mr-2" />
            <span className="font-medium text-blue-700">View All Employees</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <FaUserTie className="text-green-600 mr-2" />
            <span className="font-medium text-green-700">Add New Employee</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <FaChartLine className="text-purple-600 mr-2" />
            <span className="font-medium text-purple-700">Generate Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
