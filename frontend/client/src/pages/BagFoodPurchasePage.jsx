import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingBag, FaIndustry, FaWarehouse, FaPlus, FaEdit, FaTrash,
  FaEye, FaDownload, FaPrint, FaSearch, FaFilter, FaSignOutAlt, FaUserCog
} from "react-icons/fa";
import { useAuth } from '../hooks/useAuth';

export default function BagFoodPurchasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu] = useState("Bag & Food Purchase");
  const [activeTab, setActiveTab] = useState("bags");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
         style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      {/* Header */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button className="px-4 py-2 font-medium rounded-md transition duration-150 !bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm">
                Bag & Food Purchase
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Purchase Management</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab("bags")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${
                    activeTab === "bags" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaShoppingBag className="mr-3" />
                  Bag Purchases
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("food")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${
                    activeTab === "food" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaIndustry className="mr-3" />
                  Food Purchases
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === "bags" ? "Bag Purchase Management" : "Food Purchase Management"}
                </h1>
                <p className="text-gray-600">
                  {activeTab === "bags" 
                    ? "Manage ATA, MAIDA, SUJI, and FINE bag purchases" 
                    : "Manage wheat and other food item purchases"
                  }
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaPlus className="mr-2" />
                Add New {activeTab === "bags" ? "Bag Purchase" : "Food Purchase"}
              </button>
            </div>

            {/* Content will be implemented here */}
            <div className="text-center py-12">
              <FaShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Implementation in Progress</h3>
              <p className="text-gray-500">
                {activeTab === "bags" 
                  ? "Bag purchase management functionality will be implemented here" 
                  : "Food purchase management functionality will be implemented here"
                }
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 