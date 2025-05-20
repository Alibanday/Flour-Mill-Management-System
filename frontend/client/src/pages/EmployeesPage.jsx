import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaUsers, FaUserClock, FaUserPlus, FaMoneyBillWave,
  FaSearch, FaFileExport, FaFilter, FaHome, FaChartBar,
  FaUserCog, FaSignOutAlt, FaFolderOpen, FaWarehouse
} from "react-icons/fa";
import AddUserForm from "../components/AddUserForm";
import UserList from "../components/UserList";

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
                  onClick={() => setActiveTab("dailywagers")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${activeTab === "dailywagers" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  <FaMoneyBillWave className="mr-3" />
                  Daily Wagers
                </button>
              </li>
              {/*<li>
                <button
                  onClick={() => setActiveTab("registration")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${activeTab === "registration" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  <FaUserPlus className="mr-3" />
                  Employee Registration
                </button>
              </li>*/}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === "employees" && "Employee Management"}
              {activeTab === "attendance" && "Attendance Records"}
              {activeTab === "dailywagers" && "Daily Wagers"}
              {activeTab === "registration" && "Employee Registration"}
            </h1>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 !bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                <FaFilter className="mr-2" />
                Filter
              </button>
              <button className="flex items-center px-4 py-2 !bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                <FaFileExport className="mr-2" />
                Export
              </button>
              {activeTab === "employees" && (
                <button 
                  onClick={() => setActiveTab("registration")}
                  className="flex items-center px-4 py-2 !bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FaUserPlus className="mr-2" />
                  Add Employee
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm p-6 w-full">
            {activeTab === "employees" && (
             <UserList />
            )}

            {activeTab === "attendance" && (
              <div>
                <div className="mb-4 flex justify-between">
                  <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search attendance..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      className="block pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceData.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === "Present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
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

            {activeTab === "dailywagers" && (
              <div>
                <div className="mb-4 flex justify-between">
                  <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search daily wagers..."
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Worked</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyWagersData.map((wager) => (
                        <tr key={wager.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{wager.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.workType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.daysWorked}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.dailyRate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wager.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Pay</button>
                            <button className="text-red-600 hover:text-red-900">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "registration" && (
              <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
                <AddUserForm onClose={() => setActiveTab("employees")} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}