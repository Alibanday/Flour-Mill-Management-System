import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaHome, FaIndustry, FaExchangeAlt, FaClipboardList,
  FaChartLine, FaPlus, FaSearch, FaDolly, FaBoxes
} from "react-icons/fa";

export default function ProductionPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("DailyProduction");

  const productionMenu = [
    { name: "Daily Production", icon: <FaIndustry className="mr-3" /> },
    { name: "Stock Transfer", icon: <FaExchangeAlt className="mr-3" /> },
    { name: "Production Details", icon: <FaClipboardList className="mr-3" /> },
    { name: "Raw Materials", icon: <FaBoxes className="mr-3" /> },
    { name: "Reports", icon: <FaChartLine className="mr-3" /> }
  ];

  const productionActions = [
    { name: "New Batch", icon: <FaPlus />, action: () => console.log("New Batch") },
    { name: "Material Check", icon: <FaSearch />, action: () => console.log("Material Check") },
    { name: "Dispatch", icon: <FaDolly />, action: () => console.log("Dispatch") }
  ];

  // Sample production data
  const productionData = [
    { id: 1, product: "Wheat Flour", quantity: "500 Bags", date: "2024-03-20" },
    { id: 2, product: "Whole Wheat", quantity: "300 Bags", date: "2024-03-19" },
    { id: 3, product: "Premium Flour", quantity: "700 Bags", date: "2024-03-18" },
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
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="mr-2" />
                Back to Dashboard
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaIndustry className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Production Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">PRODUCTION MENU</h3>
            <ul className="space-y-1">
              {productionMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveMenu(item.name)}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
            {productionActions.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="flex flex-col items-center justify-center p-4 !bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:bg-blue-50 group border border-gray-100"
              >
                <div className="p-3 mb-2 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                  {button.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{button.name}</span>
              </button>
            ))}
          </div>

          {/* Production Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Production Batches</h2>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search production..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Production Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productionData.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{item.product}</h3>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="text-blue-600 font-medium">{item.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Batch ID:</span>
                    <span className="text-gray-500">#{item.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}