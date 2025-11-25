import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt, FaUserCog, FaBriefcase, FaMoneyBillWave } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import EmployeeList from '../components/EmployeeManagement/EmployeeList';
import DailyWagerForm from '../components/EmployeeManagement/DailyWagerForm';
import DailyPayments from '../components/EmployeeManagement/DailyPayments';

export default function DailyWagersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily-wagers');
  const [showDailyWagerForm, setShowDailyWagerForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleRegisterDailyWager = () => {
    setShowDailyWagerForm(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    // For daily wagers, we can use the same form or create a separate one
    setShowDailyWagerForm(true);
  };

  const handleViewEmployee = (employee) => {
    setViewingEmployee(employee);
  };

  const handleCloseForm = () => {
    setShowDailyWagerForm(false);
    setEditingEmployee(null);
  };

  const tabs = [
    { id: 'daily-wagers', name: 'Daily Wagers', icon: <FaBriefcase className="mr-2" /> },
    { id: 'daily-payments', name: 'Daily Payments', icon: <FaMoneyBillWave className="mr-2" /> }
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">DAILY WAGERS MENU</h3>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Daily Wagers Management</h1>
            <p className="text-gray-600">Manage daily wagers and their payments</p>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {activeTab === 'daily-wagers' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Daily Wagers</h3>
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
          </div>

          {/* Daily Wager Form Modal */}
          {showDailyWagerForm && (
            <DailyWagerForm 
              onClose={handleCloseForm}
              onSuccess={handleCloseForm}
            />
          )}
        </main>
      </div>
    </div>
  );
}

