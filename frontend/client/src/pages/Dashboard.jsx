import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaFolderOpen, FaShoppingBag, FaIndustry, FaCashRegister,
  FaReceipt, FaExchangeAlt, FaBoxes, FaBook, FaBalanceScale,
  FaCog, FaSignOutAlt, FaUserCog, FaChartBar, FaHome, FaWarehouse,
  FaWeightHanging, FaUsers, FaUserShield, FaChartLine, FaDatabase, FaPassport, FaBell
} from "react-icons/fa";
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/Notifications/NotificationBell';
import ThemeToggle from '../components/UI/ThemeToggle';
import LanguageToggle from '../components/UI/LanguageToggle';

import { useTranslation } from '../hooks/useTranslation';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, isAdmin, isManager, isEmployee, isCashier } = useAuth();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Role-based masters menu
  const getMastersMenu = () => {
    const baseMenu = [
      { name: "Ledger", icon: <FaBook className="mr-3" />, roles: ['Admin', 'Manager'] },
      { name: "Bags", icon: <FaShoppingBag className="mr-3" />, roles: ['Admin', 'Manager', 'Employee'] },
      { name: "Food Purchase", icon: <FaIndustry className="mr-3" />, roles: ['Admin', 'Manager'] },
      { name: "Private Purchase", icon: <FaCashRegister className="mr-3" />, roles: ['Admin', 'Manager'] },
      { name: "Transactions", icon: <FaBook className="mr-3" />, roles: ['Admin', 'Manager'] },
      { name: "Help", icon: <FaCog className="mr-3" />, roles: ['Admin', 'Manager', 'Employee', 'Cashier'] },
    ];

    return baseMenu.filter(item => item.roles.includes(role));
  };

  // Role-based function buttons
  const getFunctionButtons = () => {
    const allButtons = [
      { 
        name: "User Management", 
        shortcut: "F1", 
        icon: <FaUserShield />, 
        action: () => navigate("/users"),
        roles: ['Admin', 'Manager'],
        color: "bg-purple-100 text-purple-600"
      },
      { 
        name: "Accounts", 
        shortcut: "F2", 
        icon: <FaFolderOpen />, 
        action: () => navigate("/AccountsPage"),
        roles: ['Admin', 'Manager'],
        color: "bg-blue-100 text-blue-600"
      },
      { 
        name: "Financial Management", 
        shortcut: "F3", 
        icon: <FaChartLine />, 
        action: () => navigate("/financial"),
        roles: ['Admin', 'Manager'],
        color: "bg-emerald-100 text-emerald-600"
      },
      { 
        name: "Supplier Management", 
        shortcut: "F4", 
        icon: <FaUsers />, 
        action: () => navigate("/suppliers"),
        roles: ['Admin', 'Manager'],
        color: "bg-yellow-100 text-yellow-600"
      },
      {
        name: "Bag & Food Purchase",
        shortcut: "F5",
        icon: <FaShoppingBag />,
        action: () => navigate("/bag-food-purchase"),
        roles: ['Admin', 'Manager'],
        color: "bg-orange-100 text-orange-600"
      },
      { 
        name: "Gate Pass System", 
        shortcut: "F6", 
        icon: <FaPassport />, 
        action: () => navigate("/gate-pass"),
        roles: ['Admin', 'Manager', 'Employee'],
        color: "bg-purple-100 text-purple-600"
      },
      { 
        name: "Production", 
        shortcut: "F7", 
        icon: <FaIndustry />, 
        action: () => navigate("/production"),
        roles: ['Admin', 'Manager', 'Employee'],
        color: "bg-green-100 text-green-600"
      },
      { 
        name: "Sales & Purchase", 
        shortcut: "F8", 
        icon: <FaReceipt />,
        action: () => navigate("/sales"),
        roles: ['Admin', 'Manager', 'Cashier'],
        color: "bg-orange-100 text-orange-600"
      },
      { 
        name: "Warehouse", 
        shortcut: "F9", 
        icon: <FaWarehouse />, 
        action: () => navigate("/warehouse"),
        roles: ['Admin', 'Manager', 'Employee'],
        color: "bg-indigo-100 text-indigo-600"
      },
      { 
        name: "Inventory", 
        shortcut: "F10", 
        icon: <FaBoxes />, 
        action: () => navigate("/inventory"),
        roles: ['Admin', 'Manager', 'Employee'],
        color: "bg-cyan-100 text-cyan-600"
      },
      { 
        name: "Stock", 
        shortcut: "F11", 
        icon: <FaBoxes />, 
        action: () => navigate("/stock"),
        roles: ['Admin', 'Manager', 'Employee'],
        color: "bg-teal-100 text-teal-600"
      },
      { 
        name: "Employees", 
        shortcut: "F12", 
        icon: <FaUsers />, 
        action: () => navigate("/EmployeesPage"),
        roles: ['Admin', 'Manager'],
        color: "bg-pink-100 text-pink-600"
      },
      { 
        name: "Reports", 
        shortcut: "F13", 
        icon: <FaChartLine />, 
        action: () => navigate("/reports"),
        roles: ['Admin', 'Manager'],
        color: "bg-red-100 text-red-600"
      },
      { 
        name: "Notifications & Utilities", 
        shortcut: "F14", 
        icon: <FaBell />, 
        action: () => navigate("/notifications"),
        roles: ['Admin', 'Manager'],
        color: "bg-orange-100 text-orange-600"
      },
      { 
        name: "System Configuration", 
        shortcut: "F15", 
        icon: <FaCog />, 
        action: () => navigate("/system-config"),
        roles: ['Admin'],
        color: "bg-gray-100 text-gray-600"
      },
    ];

    return allButtons.filter(button => button.roles.includes(role));
  };

  // Role-based stats
  const getStats = () => {
    const baseStats = [
      { 
        title: "Cash in Hand", 
        value: "Rs. 0", 
        icon: <FaCashRegister />,
        trend: "up",
        roles: ['Admin', 'Manager']
      },
      { 
        title: "Total Debit", 
        value: "Rs. 0", 
        icon: <FaChartBar />,
        trend: "down",
        roles: ['Admin', 'Manager']
      },
      { 
        title: "Total Credit", 
        value: "Rs. 0", 
        icon: <FaChartBar />,
        trend: "up",
        roles: ['Admin', 'Manager']
      },
      { 
        title: "Total Stock", 
        value: "0 Units", 
        icon: <FaBoxes />,
        trend: "neutral",
        roles: ['Admin', 'Manager', 'Employee']
      },
    ];

    return baseStats.filter(stat => stat.roles.includes(role));
  };

  const mastersMenu = getMastersMenu();
  const functionButtons = getFunctionButtons();
  const stats = getStats();

  return (
    <div
      className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Dashboard" ? "bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm"}`}
                onClick={() => {
                  setActiveMenu("Dashboard");
                  navigate("/Dashboard"); 
                }}
              >
                {t('navigation.dashboard')}
              </button>
            </nav>
          </div>
                        <div className="flex items-center space-x-4">
                {/* Language Toggle */}
                <LanguageToggle />
                
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Notifications Bell - Admin and Manager only */}
                {(isAdmin() || isManager()) && <NotificationBell />}
                
                {/* Role Display */}
                <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                role === 'Admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                role === 'Manager' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                role === 'Employee' ? 'bg-green-100 text-green-800 border border-green-200' :
                'bg-purple-800 border border-purple-200'
              }`}>
                <FaUserShield className="h-3 w-3 mr-1 inline" />
                {role}
              </span>
            </div>
            
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaUserCog className="text-lg" />
            </button>

            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 bg-transparent"
            >
              <FaSignOutAlt />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('navigation.mainMenu')}</h3>
            <ul className="space-y-1">
              {/* User Management - Admin and Manager only */}
              {(isAdmin() || isManager()) && (
                <li>
                  <button
                    onClick={() => navigate("/users")}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                  >
                    <FaUserShield className="mr-3" />
                    {t('navigation.userManagement')}
                  </button>
                </li>
              )}

              {/* Supplier Management - Admin and Manager only */}
              {(isAdmin() || isManager()) && (
                <li>
                  <button
                    onClick={() => navigate("/suppliers")}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                  >
                    <FaUsers className="mr-3" />
                    {t('navigation.supplierManagement')}
                  </button>
                </li>
              )}

              {/* Gate Pass System - All roles */}
              <li>
                <button
                  onClick={() => navigate("/gate-pass")}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                >
                  <FaPassport className="mr-3" />
                  {t('navigation.gatePassSystem')}
                </button>
              </li>

              {/* Bag & Food Purchase Management - Admin, Manager */}
              <li>
                <button
                  onClick={() => navigate("/bag-food-purchase")}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                >
                  <FaShoppingBag className="mr-3" />
                  {t('navigation.bagFoodPurchase')}
                </button>
              </li>

              {/* Reports Module - Admin and Manager only */}
              {(isAdmin() || isManager()) && (
                <li>
                  <button
                    onClick={() => navigate("/reports")}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                  >
                    <FaChartLine className="mr-3" />
                    {t('navigation.reportsModule')}
                  </button>
                </li>
              )}

              {/* Notifications & Utilities - Admin and Manager only */}
              {(isAdmin() || isManager()) && (
                <li>
                  <button
                    onClick={() => navigate("/notifications")}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                  >
                    <FaBell className="mr-3" />
                    {t('navigation.notificationsUtilities')}
                  </button>
                </li>
              )}

              {/* System Configuration - Admin only */}
              {isAdmin() && (
                <li>
                  <button
                    onClick={() => navigate("/system-config")}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                  >
                    <FaCog className="mr-3" />
                    {t('navigation.systemConfiguration')}
                  </button>
                </li>
              )}
              {/* Inventory Management - All roles */}
              <li>
                <button
                  onClick={() => navigate("/inventory")}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                >
                  <FaBoxes className="mr-3" />
                  {t('navigation.inventoryManagement')}
                </button>
              </li>
              
              {mastersMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      if (item.name === "Employees") {
                        navigate("/EmployeesPage");
                      } else {
                        console.log(`${item.name} clicked`);
                      }
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                  >
                    {item.icon}
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          {/* Welcome Message */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-gray-600">
              You have access to {functionButtons.length} modules based on your {role} role.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6 w-full">
            {functionButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:bg-blue-50 group border border-gray-100"
              >
                <div className={`p-3 mb-2 rounded-full ${button.color} group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
                  {button.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{button.name}</span>
                <span className="text-xs text-gray-500 mt-1">{button.shortcut}</span>
              </button>
            ))}
          </div>

          {/* Role-based Stats Overview */}
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 w-full">
              {stats.map((stat, index) => (
                <DashboardCard 
                  key={index}
                  title={stat.title} 
                  value={stat.value} 
                  icon={stat.icon}
                  trend={stat.trend}
                />
              ))}
            </div>
          )}

          {/* Role-specific Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Role Capabilities */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaUserShield className="h-5 w-5 mr-2 text-blue-600" />
                Your Role Capabilities
              </h3>
              <div className="space-y-2">
                {role === 'Admin' && (
                  <>
                    <p className="text-sm text-gray-600">✓ Full system access and control</p>
                    <p className="text-sm text-gray-600">✓ Manage all users and roles</p>
                    <p className="text-sm text-gray-600">✓ Access to all modules and reports</p>
                    <p className="text-sm text-gray-600">✓ System configuration and settings</p>
                  </>
                )}
                {role === 'Manager' && (
                  <>
                    <p className="text-sm text-gray-600">✓ Manage team members and operations</p>
                    <p className="text-sm text-gray-600">✓ Access to most modules and reports</p>
                    <p className="text-sm text-gray-600">✓ Limited administrative functions</p>
                    <p className="text-sm text-gray-600">✓ User management capabilities</p>
                  </>
                )}
                {role === 'Employee' && (
                  <>
                    <p className="text-sm text-gray-600">✓ Access to production and warehouse</p>
                    <p className="text-sm text-gray-600">✓ Stock management and operations</p>
                    <p className="text-sm text-gray-600">✓ Basic reporting access</p>
                    <p className="text-sm text-gray-600">✓ Limited administrative functions</p>
                  </>
                )}
                {role === 'Cashier' && (
                  <>
                    <p className="text-sm text-gray-600">✓ Sales and transaction management</p>
                    <p className="text-sm text-gray-600">✓ Customer service functions</p>
                    <p className="text-sm text-gray-600">✓ Basic reporting access</p>
                    <p className="text-sm text-gray-600">✓ Limited system access</p>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaCog className="h-5 w-5 mr-2 text-green-600" />
                Available Actions
              </h3>
              <div className="space-y-2">
                {functionButtons.slice(0, 4).map((button, index) => (
                  <p key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {button.name} ({button.shortcut})
                  </p>
                ))}
                {functionButtons.length > 4 && (
                  <p className="text-sm text-gray-500 italic">
                    +{functionButtons.length - 4} more actions available
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Accounts Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200">
            <div className="border-b p-4 flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
              <h2 className="text-lg font-semibold">Accounts Management</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-white hover:text-gray-200 text-xl bg-transparent"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* AccountsPage component would go here */}
              <div className="text-center py-8 text-gray-400">
                <FaDatabase className="mx-auto text-3xl mb-2" />
                <p>Accounts Management</p>
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardCard({ title, value, icon, trend }) {
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-gray-500"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between hover:shadow-md transition-shadow border border-gray-100">
      <div>
        <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
        <div className="text-2xl font-semibold text-gray-800">{value}</div>
      </div>
      <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'} ${trendColors[trend]}`}>
        {icon}
      </div>
    </div>
  );
}