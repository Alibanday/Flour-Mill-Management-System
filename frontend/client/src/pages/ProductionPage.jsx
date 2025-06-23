import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaHome, FaIndustry, FaExchangeAlt, FaClipboardList,
  FaChartLine, FaPlus, FaSearch, FaDolly, FaBoxes
} from "react-icons/fa";
import DailyProduction from "./DailyProduction";

export default function ProductionPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Daily Production");

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
          {activeMenu === "Daily Production" ? (
            <DailyProduction />
          ) : (
            <div className="text-center text-gray-500 mt-10">Select an option from the sidebar.</div>
          )}
        </main>
      </div>
    </div>
  );
}