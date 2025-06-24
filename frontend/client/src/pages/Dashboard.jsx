import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaFolderOpen, FaShoppingBag, FaIndustry, FaCashRegister,
  FaReceipt, FaExchangeAlt, FaBoxes, FaBook, FaBalanceScale,
  FaCog, FaSignOutAlt, FaUserCog, FaChartBar, FaHome, FaWarehouse,
  FaWeightHanging, FaUsers, FaClipboardList
} from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [dashboardStats, setDashboardStats] = useState({
    cashInHand: 0,
    totalDebit: 0,
    totalCredit: 0,
    totalBags: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch dashboard stats
      const statsRes = await axios.get("http://localhost:8000/api/invoice/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch total bags stock
      const bagsRes = await axios.get("http://localhost:8000/api/stock/total-bags", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDashboardStats({
        cashInHand: statsRes.data.cashInHand || 0,
        totalDebit: statsRes.data.totalDebit || 0,
        totalCredit: statsRes.data.totalCredit || 0,
        totalBags: bagsRes.data.totalBags || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const mastersMenu = [
    { name: "Register Items", icon: <FaClipboardList className="mr-3" />, action: () => navigate("/register-items") },
    { name: "Ledger", 
      icon: <FaBook className="mr-3" />,
      
      

     },
    { name: "Bags",
       icon: <FaShoppingBag className="mr-3" />,
      action: ()=> navigate ("/bags-screen")
    },
    { 
      name: "Gov Purchase", 
      icon: <FaIndustry className="mr-3" />,
      action: () => navigate("/gov-purchase")
    },
    { name: "Private Purchase",
       icon: <FaCashRegister className="mr-3" />,
      action:() => navigate("/PrivatePurchase") },
    { name: "Transactions", icon: <FaBook className="mr-3" /> },
    { name: "Help", icon: <FaCog className="mr-3" /> },
  ];

  const functionButtons = [
    { name: "Accounts", shortcut: "F1", icon: <FaFolderOpen />, action: () => navigate("/AccountsPage")},
    { name: "Production", shortcut: "F2", icon: <FaIndustry />, action: () => navigate("/production")},
    { name: "Sales", shortcut: "F4", icon: <FaReceipt />, action: () => navigate("/SalesPage")},
    { name: "Warehouse", shortcut: "F7", icon: <FaWarehouse />, action: () => navigate("/warehouse")},
    { name: "Stock", shortcut: "F8", icon: <FaBoxes />, action: () => navigate("/StockPage") },
    { name: "Employees", shortcut: "F9", icon: <FaUsers />, action: () => navigate("/EmployeesPage") },
  ];

  return (
    <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Dashboard" ? "!bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm"}`}
                onClick={() => {
                  setActiveMenu("Dashboard");
                  navigate("/Dashboard"); 
                }}
              >
                Dashboard
              </button>

              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Reports" ? "!bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm"}`}
                onClick={() => {
                  setActiveMenu("Reports");
                  navigate("/ReportsPage");
                }}
              >
                Reports
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100 text-gray-600 hover:bg-gray-200">
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
                      if (item.action) {
                        item.action();
                      } else if (item.name === "Employees") {
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
              value={`Rs. ${dashboardStats.cashInHand.toLocaleString()}`}
              icon={<FaCashRegister />}
              trend="up"
              loading={loading}
            />
            <DashboardCard 
              title="Total Debit" 
              value={`Rs. ${dashboardStats.totalDebit.toLocaleString()}`}
              icon={<FaChartBar />}
              trend="down"
              loading={loading}
            />
            <DashboardCard 
              title="Total Credit" 
              value={`Rs. ${dashboardStats.totalCredit.toLocaleString()}`}
              icon={<FaChartBar />}
              trend="up"
              loading={loading}
            />
            <DashboardCard 
              title="Total Stock" 
              value={`${dashboardStats.totalBags.toLocaleString()} Bags`}
              icon={<FaBoxes />}
              trend="neutral"
              loading={loading}
            />
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

function DashboardCard({ title, value, icon, trend, loading }) {
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-gray-500"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between hover:shadow-md transition-shadow border border-gray-100">
      <div>
        <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
        {loading ? (
          <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
        ) : (
          <div className="text-2xl font-semibold text-gray-800">{value}</div>
        )}
      </div>
      <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'} ${trendColors[trend]}`}>
        {icon}
      </div>
    </div>
  );
}