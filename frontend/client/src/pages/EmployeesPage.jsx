import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaHome, FaSignOutAlt, FaUserCog, FaUserPlus, FaList, FaClock, FaMoneyBillWave, FaBriefcase } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import EmployeeList from '../components/EmployeeManagement/EmployeeList';
import EmployeeForm from '../components/EmployeeManagement/EmployeeForm';
import DailyWagerForm from '../components/EmployeeManagement/DailyWagerForm';
import DailyPayments from '../components/EmployeeManagement/DailyPayments';
import EmployeeDetail from '../components/EmployeeManagement/EmployeeDetail';
import EmployeeDashboard from '../components/EmployeeManagement/EmployeeDashboard';
import EmployeeReports from '../components/EmployeeManagement/EmployeeReports';
import AttendanceManagement from '../components/EmployeeManagement/AttendanceManagement';
import PayrollManagement from '../components/EmployeeManagement/PayrollManagement';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employeeSection, setEmployeeSection] = useState('employees'); // 'employees' or 'daily-wagers'
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showDailyWagerForm, setShowDailyWagerForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);

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

  const handleViewEmployee = (employee) => {
    setViewingEmployee(employee);
  };

  const handleRegisterDailyWager = () => {
    setShowDailyWagerForm(true);
  };

  const handleCloseForm = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  };

  const handleCloseDailyWagerForm = () => {
    setShowDailyWagerForm(false);
    setEditingEmployee(null);
  };

  const handleCloseDetail = () => {
    setViewingEmployee(null);
  };


  // Different tabs based on section
  const employeeTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <FaUserCog className="mr-2" /> },
    { id: 'employees', name: 'Employees', icon: <FaUsers className="mr-2" /> },
    { id: 'attendance', name: 'Attendance', icon: <FaClock className="mr-2" /> },
    { id: 'payroll', name: 'Payroll', icon: <FaMoneyBillWave className="mr-2" /> },
    { id: 'reports', name: 'Reports', icon: <FaList className="mr-2" /> }
  ];

  const dailyWagerTabs = [
    { id: 'daily-wagers', name: 'Daily Wagers', icon: <FaBriefcase className="mr-2" /> },
    { id: 'daily-payments', name: 'Daily Payments', icon: <FaMoneyBillWave className="mr-2" /> }
  ];

  const tabs = employeeSection === 'employees' ? employeeTabs : dailyWagerTabs;

  return (
    <div className="min-h-screen w-full bg-cover bg-center bg-no-repeat bg-fixed relative"
         style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-4">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="inline mr-2" />
                Back to Dashboard
              </button>
              {/* Employees Button */}
              <button
                className={`px-4 py-2 font-medium rounded-md transition duration-150 flex items-center ${
                  employeeSection === 'employees'
                    ? 'bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm'
                }`}
                onClick={() => {
                  setEmployeeSection('employees');
                  setActiveTab('dashboard');
                }}
              >
                <FaUsers className="inline mr-2" />
                Employees
              </button>
              {/* Daily Wagers Button */}
              <button
                className={`px-4 py-2 font-medium rounded-md transition duration-150 flex items-center ${
                  employeeSection === 'daily-wagers'
                    ? 'bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-indigo-600 bg-gray-200 hover:shadow-sm'
                }`}
                onClick={() => {
                  setEmployeeSection('daily-wagers');
                  setActiveTab('daily-wagers');
                }}
              >
                <FaBriefcase className="inline mr-2" />
                Daily Wagers
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

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {employeeSection === 'employees' && (
              <>
                {activeTab === 'dashboard' && (
                  <EmployeeDashboard />
                )}
                {activeTab === 'employees' && (
                  <div className="p-6">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={handleAddEmployee}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <FaUserPlus className="mr-2" />
                        Add Employee
                      </button>
                    </div>
                    <EmployeeList 
                      employeeType="Regular"
                      onEditEmployee={handleEditEmployee}
                      onAddEmployee={handleAddEmployee}
                      onViewEmployee={handleViewEmployee}
                    />
                  </div>
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
              </>
            )}

            {employeeSection === 'daily-wagers' && (
              <>
                {activeTab === 'daily-wagers' && (
                  <div className="p-6">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={handleRegisterDailyWager}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                      >
                        <FaBriefcase className="mr-2" />
                        Register Daily Wager
                      </button>
                    </div>
                    <EmployeeList 
                      employeeType="Daily Wage"
                      onEditEmployee={handleEditEmployee}
                      onAddEmployee={handleRegisterDailyWager}
                      onViewEmployee={handleViewEmployee}
                    />
                  </div>
                )}
                {activeTab === 'daily-payments' && (
                  <DailyPayments />
                )}
              </>
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

          {/* Daily Wager Form Modal */}
          {showDailyWagerForm && (
            <DailyWagerForm 
              onClose={handleCloseDailyWagerForm}
              onSuccess={handleCloseDailyWagerForm}
            />
          )}

          {/* Employee Detail Modal */}
          {viewingEmployee && (
            <EmployeeDetail
              employeeId={viewingEmployee._id}
              onClose={handleCloseDetail}
              onEdit={(employee) => {
                handleCloseDetail();
                handleEditEmployee(employee);
              }}
            />
          )}

        </main>
      </div>
    </div>
  );
}