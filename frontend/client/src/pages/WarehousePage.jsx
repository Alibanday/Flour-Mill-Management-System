import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaPallet, FaClipboardList, FaTruckLoading,
  FaChartLine, FaWarehouse, FaPlus, FaSearch, FaHome,
  FaMapMarkerAlt, FaPhone, FaClock, FaIndustry
} from "react-icons/fa";
import WarehouseList from "../components/WarehouseManagement/WarehouseList";
import WarehouseForm from "../components/WarehouseManagement/WarehouseForm";
import { useAuth } from '../hooks/useAuth';

export default function WarehousePage() {
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Warehouses");
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);

  const warehouseMenu = [
    { name: "Warehouses", icon: <FaWarehouse className="mr-3" />, roles: ['Admin', 'Manager', 'Employee'] },
    { name: "Inventory", icon: <FaBoxes className="mr-3" />, roles: ['Admin', 'Manager', 'Employee'] },
    { name: "Stock", icon: <FaPallet className="mr-3" />, roles: ['Admin', 'Manager', 'Employee'] }
  ];

  const warehouseActions = [
    { 
      name: "New Warehouse", 
      icon: <FaPlus />, 
      action: () => setShowAddWarehouse(true),
      roles: ['Admin'],
      color: "bg-blue-100 text-blue-600"
    },
    { 
      name: "Stock Check", 
      icon: <FaSearch />, 
      action: () => console.log("Stock Check"),
      roles: ['Admin', 'Manager', 'Employee'],
      color: "bg-green-100 text-green-600"
    },
    { 
      name: "Dispatch", 
      icon: <FaTruckLoading />, 
      action: () => console.log("Dispatch"),
      roles: ['Admin', 'Manager', 'Employee'],
      color: "bg-orange-100 text-orange-600"
    },
    { 
      name: "Reports", 
      icon: <FaChartLine />, 
      action: () => console.log("Reports"),
      roles: ['Admin', 'Manager'],
      color: "bg-purple-100 text-purple-600"
    }
  ];

  // Mock data for warehouse statistics
  const warehouseStats = [
    { 
      title: "Total Warehouses", 
      value: "12", 
      change: "+2", 
      changeType: "positive",
      icon: <FaWarehouse className="text-2xl" />,
      color: "bg-blue-500"
    },
    { 
      title: "Active Warehouses", 
      value: "10", 
      change: "+1", 
      changeType: "positive",
      icon: <FaIndustry className="text-2xl" />,
      color: "bg-green-500"
    },
    { 
      title: "Total Capacity", 
      value: "2,500 tons", 
      change: "+150", 
      changeType: "positive",
      icon: <FaBoxes className="text-2xl" />,
      color: "bg-purple-500"
    },
    { 
      title: "In Maintenance", 
      value: "2", 
      change: "-1", 
      changeType: "negative",
      icon: <FaClock className="text-2xl" />,
      color: "bg-yellow-500"
    }
  ];

  const getFilteredMenu = () => {
    return warehouseMenu.filter(item => item.roles.includes(user?.role));
  };

  const getFilteredActions = () => {
    return warehouseActions.filter(action => action.roles.includes(user?.role));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaHome className="h-5 w-5 text-gray-600" />
              </button>
                             <div>
                 <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
                 <p className="text-gray-600">Manage warehouses, inventory, and stock</p>
               </div>
               {(isAdmin() || isManager()) && (
                 <button
                   onClick={() => setShowAddWarehouse(true)}
                   className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   <FaPlus className="mr-2" />
                   Add Warehouse
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {warehouseStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getFilteredActions().map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`p-4 rounded-lg border-2 border-dashed ${action.color} hover:opacity-80 transition-opacity`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <span className="text-sm font-medium">{action.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {getFilteredMenu().map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveMenu(item.name)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeMenu === item.name
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
                         {activeMenu === "Warehouses" && (
               <WarehouseList 
                 onWarehouseAdded={() => {
                   // This will be called when a warehouse is added/updated
                   // The WarehouseList will refresh automatically
                 }}
               />
             )}
            {activeMenu === "Inventory" && (
              <div className="text-center py-12">
                <FaBoxes className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Inventory Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Navigate to the Inventory module to manage inventory items.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/inventory')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Go to Inventory
                  </button>
                </div>
              </div>
            )}
            {activeMenu === "Stock" && (
              <div className="text-center py-12">
                <FaPallet className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Stock Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Navigate to the Stock module to manage stock levels.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/stock')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Go to Stock
                  </button>
                </div>
              </div>
            )}
                     </div>
         </div>
       </div>

       {/* Warehouse Form Modal */}
       {showAddWarehouse && (
         <WarehouseForm
           onSave={(warehouseData) => {
             // Refresh the warehouse list after adding
             setShowAddWarehouse(false);
             // Force a refresh of the warehouse list
             window.location.reload();
           }}
           onCancel={() => setShowAddWarehouse(false)}
           mode="create"
         />
       )}
     </div>
   );
 }
