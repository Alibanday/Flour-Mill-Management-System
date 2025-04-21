import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import AccountsPage from "./AccountsPage";
import {
  FaFolderOpen, FaShoppingBag, FaIndustry, FaCashRegister,
  FaReceipt, FaExchangeAlt, FaBoxes, FaBook, FaBalanceScale,
  FaCog, FaSignOutAlt, FaUserCog, FaChartBar
} from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false); // toggle AccountsPage

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const mastersMenu = [
    "Opening", "Bags", "Food Purchase", "Private Purchase", 
    "Production", "Sale", "Warehouse Transfer", "Transactions",
    "Reports", "Payroll", "Help"
  ];

  const functionButtons = [
    {
      name: "Accounts (F1)",
      icon: <FaFolderOpen />,
      action: () => setShowForm(true), // open form
    },
    { name: "Food Purchase (F2)", icon: <FaShoppingBag />, action: () => console.log("Food Purchase clicked") },
    { name: "Production (F3)", icon: <FaIndustry />, action: () => console.log("Production clicked") },
    { name: "Stock Sale (F4)", icon: <FaReceipt />, action: () => console.log("Sale clicked") },
    { name: "Whare House (F7)", icon: <FaExchangeAlt />, action: () => console.log("JV Voucher clicked") },
    { name: "Stock (F8)", icon: <FaBoxes />, action: () => console.log("Stock clicked") },
    { name: "Ledger (F9)", icon: <FaBook />, action: () => console.log("Ledger clicked") },
    { name: "Weight (F10)", icon: <FaBalanceScale />, action: () => console.log("Weight clicked") },
    { name: "Setting (F11)", icon: <FaCog />, action: () => console.log("Setting clicked") },
  ];

  return (
    <div className="min-h-screen w-screen relative">
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/dashboard.jpg')" }}
      />

      <div className="relative z-20">
        <div className="bg-[#DDF1F2] border-b shadow px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {functionButtons.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="flex flex-col items-center justify-center text-[#2F528F] hover:text-[#1C3A6B] w-20 h-20 min-w-[5rem] flex-shrink-0 transition-colors !bg-white"
              >
                <div className="text-2xl mb-1 text-[#2F528F]">{item.icon}</div>
                <span className="text-xs text-center leading-tight">{item.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center text-[#2F528F] !bg-white hover:text-[#1C3A6B] transition-colors ml-4"
          >
            <FaSignOutAlt className="text-2xl" />
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>

        <div className="flex">
          <div className="bg-white w-48 min-h-[calc(100vh-5rem)] py-4 flex flex-col items-start border-r border-gray-200">
            <h2 className="font-bold text-[#2F528F] px-4 py-2 text-sm mb-2">Masters</h2>
            <div className="w-full">
              {mastersMenu.map((item, idx) => (
                <div key={idx} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => console.log(`${item} clicked`)}
                    className="w-full text-left text-[#2F528F] hover:bg-[#B7DEE8] px-4 py-3 text-sm transition-colors duration-200 !bg-white"
                  >
                    {item}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 relative">
            <main className="px-6 pb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <DashboardCard title="Cash in Hand" value="Rs. 0" icon={<FaCashRegister size={20} />} />
                <DashboardCard title="Total Debit" value="Rs. 0" icon={<FaChartBar size={20} />} />
                <DashboardCard title="Total Credit" value="Rs. 0" icon={<FaChartBar size={20} />} />
                <DashboardCard title="Total Stock" value="0 Units" icon={<FaBoxes size={20} />} />
                <DashboardCard title="Notifications" value="0" icon={<FaCog size={20} />} />
              </div>
            </main>

            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
                 <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl relative border border-gray-300">
                    <button
                     onClick={() => setShowForm(false)}
                     className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl font-bold"
                    >
                       ×
                      </button>
                      <AccountsPage />
                    </div>
                  </div>
                )}


          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon }) {
  return (
    <div className="bg-gradient-to-r from-[#04686D] to-[#06868A] text-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium">{title}</div>
        <div>{icon}</div>
      </div>
      <div className="mt-4 text-3xl font-bold">{value}</div>
      <div className="text-sm mt-2 text-white/80">Just Updated</div>
    </div>
  );
}
