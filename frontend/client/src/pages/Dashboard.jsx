import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import AccountsPage from "./AccountsPage";
import {
  FaFolderOpen, FaShoppingBag, FaIndustry, FaCashRegister,
  FaReceipt, FaExchangeAlt, FaBoxes, FaBook, FaBalanceScale,
  FaCog, FaSignOutAlt, FaUserCog, FaChartBar, FaHome, FaWarehouse,
  FaWeightHanging, FaUsers
} from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const mastersMenu = [
    { name: "Opening", icon: <FaFolderOpen className="mr-3" /> },
    { name: "Bags", icon: <FaShoppingBag className="mr-3" /> },
    { name: "Food Purchase", icon: <FaIndustry className="mr-3" /> },
    { name: "Private Purchase", icon: <FaCashRegister className="mr-3" /> },
    { name: "Warehouse", icon: <FaWarehouse className="mr-3" /> },
    { name: "Transactions", icon: <FaBook className="mr-3" /> },
    { name: "Reports", icon: <FaChartBar className="mr-3" /> },
    { name: "Payroll", icon: <FaUsers className="mr-3" /> },
    { name: "Help", icon: <FaCog className="mr-3" /> }
  ];

  const functionButtons = [
    { name: "Accounts", shortcut: "F1", icon: <FaFolderOpen />, action: () => setShowForm(true) },
    { name: "Production", shortcut: "F3", icon: <FaIndustry />, action: () => console.log("Production clicked") },
    { name: "Sales", shortcut: "F4", icon: <FaReceipt />, action: () => console.log("Sale clicked") },
    { name: "Warehouse", shortcut: "F7", icon: <FaWarehouse />, action: () => console.log("JV Voucher clicked") },
    { name: "Stock", shortcut: "F8", icon: <FaBoxes />, action: () => console.log("Stock clicked") },
    { name: "Ledger", shortcut: "F9", icon: <FaBook />, action: () => console.log("Ledger clicked") },
    
    
  ];

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
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Dashboard" ? "!bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-500 hover:bg-white hover:shadow-sm"}`}
                onClick={() => setActiveMenu("Dashboard")}
              >
                Dashboard
              </button>

              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Operations" ? "!bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-500 hover:bg-white hover:shadow-sm"}`}
                onClick={() => setActiveMenu("Operations")}
              >
                Operations
              </button>

              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Reports" ? "!bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-500 hover:bg-white hover:shadow-sm"}`}
                onClick={() => setActiveMenu("Reports")}
              >
                Reports
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">MAIN MENU</h3>
            <ul className="space-y-1">
              {mastersMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      if (item.name === "Payroll") {
                        navigate("/EmployeesPage");
                      } else {
                        console.log(`${item.name} clicked`);
                      }
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors !bg-transparent"
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
          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6 w-full">
            {functionButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="flex flex-col items-center justify-center p-4 !bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:bg-blue-50 group border border-gray-100"
              >
                <div className="p-3 mb-2 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                  {button.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{button.name}</span>
                <span className="text-xs text-gray-500 mt-1">{button.shortcut}</span>
              </button>
            ))}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 w-full">
            <DashboardCard 
              title="Cash in Hand" 
              value="Rs. 0" 
              icon={<FaCashRegister />}
              trend="up"
            />
            <DashboardCard 
              title="Total Debit" 
              value="Rs. 0" 
              icon={<FaChartBar />}
              trend="down"
            />
            <DashboardCard 
              title="Total Credit" 
              value="Rs. 0" 
              icon={<FaChartBar />}
              trend="up"
            />
            <DashboardCard 
              title="Total Stock" 
              value="0 Units" 
              icon={<FaBoxes />}
              trend="neutral"
            />
          </div>

          {/* Recent Activity Section 
          <div className="bg-white rounded-xl shadow-sm p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              <button className="text-sm text-blue-600 hover:text-blue-800 !bg-transparent">
                View All
              </button>
            </div>
            <div className="text-center py-8 text-gray-400">
              <FaExchangeAlt className="mx-auto text-3xl mb-2" />
              <p>No recent activity</p>
            </div>
          </div>*/}
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
              <AccountsPage />
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