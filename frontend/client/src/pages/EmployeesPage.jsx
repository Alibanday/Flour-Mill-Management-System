import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaUsers, FaUserClock, FaUserPlus, FaMoneyBillWave,
  FaSearch, FaFileExport, FaFilter, FaHome, FaChartBar,
  FaUserCog, FaSignOutAlt, FaFolderOpen, FaWarehouse
} from "react-icons/fa";

export default function EmployeePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("employees");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const employeeData = [
    { id: 1, name: "John Doe", position: "Manager", department: "Admin", salary: "50,000", status: "Active" },
    { id: 2, name: "Jane Smith", position: "Accountant", department: "Finance", salary: "35,000", status: "Active" },
    { id: 3, name: "Robert Johnson", position: "Operator", department: "Production", salary: "25,000", status: "Active" },
  ];

  const attendanceData = [
    { id: 1, name: "John Doe", date: "2023-05-01", status: "Present", checkIn: "08:00", checkOut: "17:00" },
    { id: 2, name: "Jane Smith", date: "2023-05-01", status: "Present", checkIn: "08:15", checkOut: "17:10" },
    { id: 3, name: "Robert Johnson", date: "2023-05-01", status: "Absent", checkIn: "-", checkOut: "-" },
  ];

  const dailyWagersData = [
    { id: 1, name: "Ali Khan", workType: "Loading", daysWorked: 5, dailyRate: "1,000", amount: "5,000" },
    { id: 2, name: "Sara Ahmed", workType: "Cleaning", daysWorked: 6, dailyRate: "800", amount: "4,800" },
  ];

  return (
    <div
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat bg-fixed relative"
        style={{ backgroundImage: "url('/dashboard.jpg')" }}
      >
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="inline mr-2" />
                Back to Dashboard
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100  text-gray-600 hover:bg-gray-200">
              <FaUserCog className="text-lg" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 !bg-transparent"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">PAYROLL MENU</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab("employees")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${activeTab === "employees" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  <FaUsers className="mr-3" />
                  Employees
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${activeTab === "attendance" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  <FaUserClock className="mr-3" />
                  Attendance
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("dailyWagers")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${activeTab === "dailyWagers" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  <FaMoneyBillWave className="mr-3" />
                  Daily Wagers
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("payroll")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${activeTab === "payroll" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  <FaChartBar className="mr-3" />
                  Payroll Reports
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Employee Management</h1>
            <p className="text-gray-600">Manage employees, attendance, and payroll information</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-200"
            >
              <FaUserPlus className="h-8 w-8 mb-2" />
              <span className="font-medium">Add Employee</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all duration-200">
              <FaSearch className="h-8 w-8 mb-2" />
              <span className="font-medium">Search</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all duration-200">
              <FaFileExport className="h-8 w-8 mb-2" />
              <span className="font-medium">Export</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-700 transition-all duration-200">
              <FaFilter className="h-8 w-8 mb-2" />
              <span className="font-medium">Filter</span>
            </button>
          </div>

          {/* Content Area */}
          {showRegistrationForm ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Employee Form</h2>
                <p className="text-gray-600 mb-6">This form will be implemented when the Employee Management module is developed.</p>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Employees
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Employees Tab */}
              {activeTab === "employees" && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Employee List</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeeData.map((employee) => (
                          <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.position}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.salary}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {employee.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === "attendance" && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceData.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkIn}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkOut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Daily Wagers Tab */}
              {activeTab === "dailyWagers" && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Daily Wagers</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dailyWagersData.map((wager) => (
                          <tr key={wager.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{wager.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.workType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.daysWorked}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.dailyRate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payroll Tab */}
              {activeTab === "payroll" && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Reports</h3>
                  <p className="text-gray-600">Payroll reporting functionality will be implemented when this module is developed.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}