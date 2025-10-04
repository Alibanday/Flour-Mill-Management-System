import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaHome, FaSignOutAlt, FaUserCog, FaUserPlus, FaList, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import EmployeeList from '../components/EmployeeManagement/EmployeeList';
import EmployeeForm from '../components/EmployeeManagement/EmployeeForm';
import EmployeeDashboard from '../components/EmployeeManagement/EmployeeDashboard';
import EmployeeReports from '../components/EmployeeManagement/EmployeeReports';
import AttendanceManagement from '../components/EmployeeManagement/AttendanceManagement';
import PayrollManagement from '../components/EmployeeManagement/PayrollManagement';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };


  const handleCloseForm = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  };


  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <FaUserCog className="mr-2" /> },
    { id: 'employees', name: 'Employees', icon: <FaUsers className="mr-2" /> },
    { id: 'attendance', name: 'Attendance', icon: <FaClock className="mr-2" /> },
    { id: 'payroll', name: 'Payroll', icon: <FaMoneyBillWave className="mr-2" /> },
    { id: 'reports', name: 'Reports', icon: <FaList className="mr-2" /> }
  ];

  return (
    <div className="min-h-screen w-full bg-cover bg-center bg-no-repeat bg-fixed relative"
         style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="inline mr-2" />
                Back to Dashboard
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <FaUserCog className="text-lg" />
              <span className="text-sm">{user?.firstName} {user?.lastName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 bg-transparent"
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">EMPLOYEE MENU</h3>
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                </li>
              ))}
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

          {/* Tab Navigation for Mobile */}
          <div className="md:hidden mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-1">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          {activeTab === 'employees' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <button 
                onClick={handleAddEmployee}
                className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-200"
              >
                <FaUserPlus className="h-8 w-8 mb-2" />
                <span className="font-medium">Add Employee</span>
              </button>
              <button 
                onClick={() => setActiveTab('employees')}
                className="flex flex-col items-center justify-center p-4 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all duration-200"
              >
                <FaList className="h-8 w-8 mb-2" />
                <span className="font-medium">View Employees</span>
              </button>
              <button 
                onClick={() => setActiveTab('attendance')}
                className="flex flex-col items-center justify-center p-4 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all duration-200"
              >
                <FaClock className="h-8 w-8 mb-2" />
                <span className="font-medium">Attendance</span>
              </button>
              <button 
                onClick={() => setActiveTab('payroll')}
                className="flex flex-col items-center justify-center p-4 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-700 transition-all duration-200"
              >
                <FaMoneyBillWave className="h-8 w-8 mb-2" />
                <span className="font-medium">Payroll</span>
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {activeTab === 'dashboard' && (
              <EmployeeDashboard />
            )}
            {activeTab === 'employees' && (
              <EmployeeList 
                onEditEmployee={handleEditEmployee}
                onAddEmployee={handleAddEmployee}
              />
            )}
            {activeTab === 'attendance' && (
              <AttendanceManagement />
            )}
            {activeTab === 'payroll' && (
              <PayrollManagement />
            )}
            {activeTab === 'reports' && (
              <EmployeeReports />
            )}
          </div>

          {/* Employee Form Modal */}
          {showEmployeeForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <EmployeeForm 
                  employee={editingEmployee}
                  onClose={handleCloseForm}
                  onSuccess={handleCloseForm}
                />
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}