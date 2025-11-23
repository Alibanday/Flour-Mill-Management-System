import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  FaFolderOpen, FaShoppingBag, FaIndustry, FaCashRegister,
  FaReceipt, FaExchangeAlt, FaBoxes, FaBook, FaBalanceScale,
  FaCog, FaSignOutAlt, FaUserCog, FaChartBar, FaHome, FaWarehouse,
  FaWeightHanging, FaUsers, FaUserShield, FaChartLine, FaDatabase, FaPassport, FaBell, FaUserPlus
} from "react-icons/fa";
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/Notifications/NotificationBell';
import ThemeToggle from '../components/UI/ThemeToggle';
import LanguageToggle from '../components/UI/LanguageToggle';

import { useTranslation } from '../hooks/useTranslation';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, isAdmin, isGeneralManager, isSalesManager, isProductionManager, isWarehouseManager, isManager, isEmployee, isCashier, isSales } = useAuth();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const isSalesMgr = isSalesManager();
  const canSeeUserManagement = isAdmin() || (isManager() && !isSalesMgr);
  const canSeeSupplierManagement = isAdmin() || isGeneralManager() || isSalesMgr || isProductionManager() || isWarehouseManager();
  const canAccessGatePass = !isSalesMgr;
  const canAccessBagFoodPurchase = isAdmin() || isGeneralManager() || isProductionManager() || isWarehouseManager();
  const canSeeReports = isAdmin() || isGeneralManager() || isProductionManager() || isWarehouseManager();
  const canSeeNotifications = isAdmin() || isGeneralManager() || isProductionManager() || isWarehouseManager();

  const roleTranslationMap = {
    'Admin': 'admin',
    'General Manager': 'generalManager',
    'Sales Manager': 'salesManager',
    'Production Manager': 'productionManager',
    'Warehouse Manager': 'warehouseManager',
    'Manager': 'manager',
    'Employee': 'employee',
    'Cashier': 'cashier',
    'Sales': 'sales'
  };

  const currentRoleKey = roleTranslationMap[role] || 'employee';
  const translatedRoleName = t(`roles.${currentRoleKey}`);
  const capabilitiesList = t(`dashboard.capabilities.${currentRoleKey}`);
  const roleCapabilities = Array.isArray(capabilitiesList) ? capabilitiesList : [];
  const capabilityFallback = t('dashboard.capabilities.default');

  const quickActionTranslationMap = {
    "Production": "dashboard.quickActions.production",
    "Sales": "dashboard.quickActions.sales",
    "Warehouse": "dashboard.quickActions.warehouse",
    "Warehouse Dashboard": "dashboard.quickActions.warehouseDashboard",
    "Stock": "dashboard.quickActions.stock",
    "Bag Purchase": "dashboard.quickActions.bagPurchase",
    "Wheat Purchase": "dashboard.quickActions.wheatPurchase",
    "Bag Sales": "dashboard.quickActions.bagSales",
    "Wheat Sales": "dashboard.quickActions.wheatSales"
  };

  // Redirect warehouse managers to their own dashboard
  useEffect(() => {
    if (isWarehouseManager()) {
      navigate('/warehouse-manager-dashboard');
    }
  }, [isWarehouseManager, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Role-based masters menu
  const getMastersMenu = () => {
    const baseMenu = [];
    const filteredMenu = baseMenu.filter(item => item.roles.includes(role));
    if (isSalesMgr) {
      return [];
    }
    return filteredMenu;
  };

  // Role-based function buttons (only unique items not in sidebar)
  const getFunctionButtons = () => {
    const allButtons = [
      {
        name: "Production",
        shortcut: "F7",
        icon: <FaIndustry />,
        action: () => navigate("/production"),
        roles: ['Admin', 'General Manager', 'Production Manager'],
        color: "bg-green-100 text-green-600"
      },
      {
        name: "Bag Sales",
        shortcut: "F8",
        icon: <FaReceipt />,
        action: () => navigate("/bag-sales"),
        roles: ['Admin', 'General Manager', 'Sales Manager'],
        color: "bg-orange-100 text-orange-600"
      },
      {
        name: "Wheat Sales",
        shortcut: "F13",
        icon: <FaReceipt />,
        action: () => navigate("/wheat-sales"),
        roles: ['Admin', 'General Manager', 'Sales Manager'],
        color: "bg-amber-100 text-amber-600"
      },
      {
        name: "Warehouse",
        shortcut: "F9",
        icon: <FaWarehouse />,
        action: () => navigate("/warehouses"),
        roles: ['Admin', 'General Manager', 'Warehouse Manager', 'Sales Manager'],
        color: "bg-indigo-100 text-indigo-600"
      },
      {
        name: "Warehouse Dashboard",
        shortcut: "F17",
        icon: <FaWarehouse />,
        action: () => navigate("/warehouse-manager-dashboard"),
        roles: ['Warehouse Manager'],
        color: "bg-purple-100 text-purple-600"
      },
      {
        name: "Stock",
        shortcut: "F11",
        icon: <FaBoxes />,
        action: () => navigate("/stock"),
        roles: ['Admin', 'General Manager', 'Warehouse Manager'],
        color: "bg-teal-100 text-teal-600"
      },
      {
        name: "Bag Purchase",
        shortcut: "F10",
        icon: <FaShoppingBag />,
        action: () => navigate("/bag-purchase"),
        roles: ['Admin', 'General Manager', 'Production Manager', 'Warehouse Manager'],
        color: "bg-yellow-100 text-yellow-600"
      },
      {
        name: "Wheat Purchase",
        shortcut: "F12",
        icon: <FaIndustry />,
        action: () => navigate("/food-purchase"),
        roles: ['Admin', 'General Manager', 'Production Manager', 'Warehouse Manager'],
        color: "bg-green-100 text-green-600"
      },
    ];

    const visibleButtons = allButtons.filter(button => button.roles.includes(role));

    if (isSalesMgr) {
      const allowedSalesManagerButtons = new Set([
        "Bag Sales",
        "Wheat Sales",
        "Warehouse"
      ]);
      return visibleButtons.filter(button => allowedSalesManagerButtons.has(button.name));
    }

    return visibleButtons;
  };

  // Role-based stats
  const getStats = () => {
    const baseStats = [
      {
        title: t('dashboard.stats.cashInHand'),
        value: "Rs. 0",
        icon: <FaCashRegister />,
        trend: "up",
        roles: ['Admin', 'Manager']
      },
      {
        title: t('dashboard.stats.totalDebit'),
        value: "Rs. 0",
        icon: <FaChartBar />,
        trend: "down",
        roles: ['Admin', 'Manager']
      },
      {
        title: t('dashboard.stats.totalCredit'),
        value: "Rs. 0",
        icon: <FaChartBar />,
        trend: "up",
        roles: ['Admin', 'Manager']
      },
      {
        title: t('dashboard.stats.totalStock'),
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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${role === 'Admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                role === 'Manager' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  role === 'Employee' ? 'bg-green-100 text-green-800 border border-green-200' :
                    'bg-purple-800 border border-purple-200'
                }`}>
                <FaUserShield className="h-3 w-3 mr-1 inline" />
                {translatedRoleName}
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
        {/* Sidebar - Hidden for Warehouse Managers */}
        {!isWarehouseManager() && (
          <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('navigation.mainMenu')}</h3>
              <ul className="space-y-1">
                {/* Gate Pass System - All roles */}
                {canAccessGatePass && (
                  <li>
                    <button
                      onClick={() => navigate("/gate-pass")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaPassport className="mr-3" />
                      {t('navigation.gatePassSystem')}
                    </button>
                  </li>
                )}

                {/* Financial Management - Admin and General Manager only */}
                {(isAdmin() || isGeneralManager()) && (
                  <li>
                    <button
                      onClick={() => navigate("/financial")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaChartLine className="mr-3" />
                      {t('dashboard.quickActions.financialManagement')}
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

                {/* Bag Purchase - Admin, GM, Production, Warehouse */}
                {canAccessBagFoodPurchase && (
                  <li>
                    <button
                      onClick={() => navigate("/bag-purchase")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaShoppingBag className="mr-3" />
                      {t('dashboard.quickActions.bagPurchase') || "Bag Purchase"}
                    </button>
                  </li>
                )}

                {/* Wheat Purchase - Admin, GM, Production, Warehouse */}
                {canAccessBagFoodPurchase && (
                  <li>
                    <button
                      onClick={() => navigate("/food-purchase")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaIndustry className="mr-3" />
                      {t('dashboard.quickActions.wheatPurchase') || "Wheat Purchase"}
                    </button>
                  </li>
                )}

                {/* Bag Sales - Admin, Manager, Sales */}
                {(isAdmin() || isManager() || role === 'Sales') && (
                  <li>
                    <button
                      onClick={() => navigate("/bag-sales")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaReceipt className="mr-3" />
                      {t('dashboard.quickActions.bagSales') || "Bag Sales"}
                    </button>
                  </li>
                )}

                {/* Wheat Sales - Admin, Manager, Sales */}
                {(isAdmin() || isManager() || role === 'Sales') && (
                  <li>
                    <button
                      onClick={() => navigate("/wheat-sales")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaReceipt className="mr-3" />
                      {t('dashboard.quickActions.wheatSales') || "Wheat Sales"}
                    </button>
                  </li>
                )}

                {/* Customer Management - Admin, Manager, Sales */}
                {(isAdmin() || isManager() || role === 'Sales') && (
                  <li>
                    <button
                      onClick={() => navigate("/customers")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaUserPlus className="mr-3" />
                      {t('navigation.customerManagement')}
                    </button>
                  </li>
                )}

                {/* Supplier Management - Admin and Manager only */}
                {canSeeSupplierManagement && (
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

                {/* Employees - Admin and General Manager only */}
                {(isAdmin() || isGeneralManager()) && (
                  <li>
                    <button
                      onClick={() => navigate("/employees")}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      <FaUsers className="mr-3" />
                      {t('dashboard.quickActions.employees')}
                    </button>
                  </li>
                )}

                {mastersMenu.map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                        if (typeof item.action === 'function') {
                          item.action();
                        }
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                    >
                      {item.icon}
                      {t(item.translationKey)}
                    </button>
                  </li>
                ))}

                {/* User Management - Admin and Manager only - Last */}
                {canSeeUserManagement && (
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
              </ul>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          {/* Welcome Message */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {`${t('dashboard.messages.welcomeBack')}, ${user?.firstName || t('dashboard.messages.userFallback')}!`}
            </h1>
            <p className="text-gray-600">
              {`${t('dashboard.messages.accessIntro')} ${functionButtons.length} ${t('dashboard.messages.modulesWord')} ${t('dashboard.messages.basedOn')} ${translatedRoleName} ${t('dashboard.messages.roleWord')}.`}
            </p>
          </div>

          {/* Notifications & Utilities - Above Stats */}
          {canSeeNotifications && (
            <div className="flex justify-end mb-4 w-full">
              <button
                onClick={() => navigate("/notifications")}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg shadow-sm hover:shadow-md hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-all"
              >
                <FaBell className="text-lg" />
                <span>{t('navigation.notificationsUtilities')}</span>
              </button>
            </div>
          )}

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

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6 w-full">
            {functionButtons.map((button, index) => {
              const translationKey = quickActionTranslationMap[button.name];
              const buttonLabel = translationKey ? t(translationKey) : button.name;

              return (
                <button
                  key={index}
                  onClick={button.action}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:bg-blue-50 group border border-gray-100"
                >
                  <div className={`p-3 mb-2 rounded-full ${button.color} group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
                    {button.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{buttonLabel}</span>
                  <span className="text-xs text-gray-500 mt-1">{button.shortcut}</span>
                </button>
              );
            })}
          </div>

          {/* Reports Module - Prominent Button */}
          {canSeeReports && (
            <div className="mb-6 w-full">
              <button
                onClick={() => navigate("/reports")}
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.01]"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-full backdrop-blur-sm">
                    <FaChartLine className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">{t('navigation.reportsModule')}</h3>
                    <p className="text-sm text-blue-100 mt-1">View detailed reports and analytics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span>View Reports</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}
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