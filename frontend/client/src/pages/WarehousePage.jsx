import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaPallet, FaWarehouse, FaHome, FaIndustry
} from "react-icons/fa";
import WarehouseList from "../components/WarehouseManagement/WarehouseList";
import WarehouseForm from "../components/WarehouseManagement/WarehouseForm";
import { useAuth } from '../hooks/useAuth';

export default function WarehousePage() {
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Warehouses");
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [warehouseStats, setWarehouseStats] = useState({
    totalWarehouses: 0,
    activeWarehouses: 0,
    totalCapacity: 0,
    loading: true
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch real-time warehouse statistics
  const fetchWarehouseStats = async () => {
    try {
      setWarehouseStats(prev => ({ ...prev, loading: true }));
      
      const response = await fetch('http://localhost:7000/api/warehouses/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWarehouseStats({
            totalWarehouses: data.data.totalWarehouses || 0,
            activeWarehouses: data.data.activeWarehouses || 0,
            totalCapacity: data.data.totalCapacity || 0,
            loading: false
          });
          setLastUpdated(new Date());
          console.log('📊 Warehouse stats updated:', data.data);
        }
      } else {
        console.error('Failed to fetch warehouse stats:', response.statusText);
        setWarehouseStats(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
      setWarehouseStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Set up real-time updates
  useEffect(() => {
    // Initial fetch
    fetchWarehouseStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchWarehouseStats, 30000);

    // Listen for warehouse updates
    const handleWarehouseUpdate = () => {
      console.log('🔄 Warehouse updated, refreshing stats...');
      fetchWarehouseStats();
    };

    window.addEventListener('warehouseUpdated', handleWarehouseUpdate);
    window.addEventListener('warehouseAdded', handleWarehouseUpdate);
    window.addEventListener('warehouseDeleted', handleWarehouseUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('warehouseUpdated', handleWarehouseUpdate);
      window.removeEventListener('warehouseAdded', handleWarehouseUpdate);
      window.removeEventListener('warehouseDeleted', handleWarehouseUpdate);
    };
  }, []);

  const warehouseMenu = [
    { name: "Warehouses", icon: <FaWarehouse className="mr-3" />, roles: ['Admin', 'Manager', 'Employee'] },
    { name: "Inventory", icon: <FaBoxes className="mr-3" />, roles: ['Admin', 'Manager', 'Employee'] },
    { name: "Stock", icon: <FaPallet className="mr-3" />, roles: ['Admin', 'Manager', 'Employee'] }
  ];


  // Real-time warehouse statistics
  const getWarehouseStatsData = () => [
    { 
      title: "Total Warehouses", 
      value: warehouseStats.loading ? "..." : warehouseStats.totalWarehouses.toString(), 
      change: "+2", 
      changeType: "positive",
      icon: <FaWarehouse className="text-2xl" />,
      color: "bg-blue-500"
    },
    { 
      title: "Active Warehouses", 
      value: warehouseStats.loading ? "..." : warehouseStats.activeWarehouses.toString(), 
      change: "+1", 
      changeType: "positive",
      icon: <FaIndustry className="text-2xl" />,
      color: "bg-green-500"
    },
    { 
      title: "Total Capacity", 
      value: warehouseStats.loading ? "..." : `${warehouseStats.totalCapacity.toLocaleString()} tons`, 
      change: "+150", 
      changeType: "positive",
      icon: <FaBoxes className="text-2xl" />,
      color: "bg-purple-500"
    }
  ];

  const getFilteredMenu = () => {
    return warehouseMenu.filter(item => item.roles.includes(user?.role));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <FaWarehouse className="text-3xl text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
                <p className="text-gray-600">Manage warehouses, inventory, and stock</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm"
              >
                <FaHome className="mr-2" />
                <span>Back to Dashboard</span>
              </button>
              <span className="text-sm text-gray-500">
                Welcome back, {user?.name || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {getWarehouseStatsData().map((stat, index) => (
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
