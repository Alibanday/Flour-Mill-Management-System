import React, { useState, useEffect } from 'react';
import { 
  FaDownload, FaFilePdf, FaFileExcel, FaChartBar, FaUsers, 
  FaBuilding, FaWarehouse, FaDollarSign, FaCalendarAlt, 
  FaFilter, FaSearch, FaSpinner, FaPrint 
} from 'react-icons/fa';

export default function EmployeeReports() {
  const [reports, setReports] = useState({
    departmentReport: [],
    salaryReport: [],
    attendanceReport: [],
    performanceReport: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('department');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    department: '',
    warehouse: '',
    status: ''
  });

  useEffect(() => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  }, []);

  const generateReport = async (reportType) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        return;
      }

      const params = new URLSearchParams({
        reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(filters.department && { department: filters.department }),
        ...(filters.warehouse && { warehouse: filters.warehouse }),
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(`http://localhost:7000/api/employees/reports?${params}`, {
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
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      if (data.success) {
        setReports(prev => ({
          ...prev,
          [reportType]: data.data
        }));
      } else {
        setError(data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    // This would typically call an export API endpoint
    console.log(`Exporting ${selectedReport} report as ${format}`);
    // Implementation would depend on backend export functionality
  };

  const reportTypes = [
    { id: 'department', name: 'Department Report', icon: FaBuilding, description: 'Employee distribution by department' },
    { id: 'salary', name: 'Salary Report', icon: FaDollarSign, description: 'Salary analysis and statistics' },
    { id: 'attendance', name: 'Attendance Report', icon: FaCalendarAlt, description: 'Employee attendance summary' },
    { id: 'performance', name: 'Performance Report', icon: FaChartBar, description: 'Employee performance metrics' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Reports</h2>
            <p className="text-gray-600">Generate and export comprehensive employee reports</p>
          </div>
          <div className="flex items-center space-x-2">
            <FaFilePdf className="text-red-600 text-xl" />
            <FaFileExcel className="text-green-600 text-xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaFilter className="mr-2 text-blue-600" />
          Report Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              <option value="Production">Production</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center mb-2">
                  <IconComponent className={`text-xl mr-2 ${
                    selectedReport === report.id ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <span className={`font-medium ${
                    selectedReport === report.id ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {report.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Report Button */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generate Report</h3>
            <p className="text-gray-600">Click to generate the selected report</p>
          </div>
          <button
            onClick={() => generateReport(selectedReport)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FaChartBar className="mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaSearch className="text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Report Results */}
      {reports[selectedReport] && reports[selectedReport].length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {reportTypes.find(r => r.id === selectedReport)?.name} Results
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => exportReport('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <FaFilePdf className="mr-2" />
                Export PDF
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <FaFileExcel className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <FaPrint className="mr-2" />
                Print
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedReport === 'department' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Salary
                      </th>
                    </>
                  )}
                  {selectedReport === 'salary' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports[selectedReport].map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {selectedReport === 'department' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.avgSalary ? `PKR ${Math.round(item.avgSalary).toLocaleString()}` : 'N/A'}
                        </td>
                      </>
                    )}
                    {selectedReport === 'salary' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          PKR {item.salary?.toLocaleString()}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {reports[selectedReport] && reports[selectedReport].length === 0 && !loading && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FaChartBar className="text-gray-400 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No data found for the selected filters and date range.</p>
        </div>
      )}
    </div>
  );
}
