import React, { useState, useEffect } from 'react';
import { 
  FaBoxes, FaWarehouse, FaExclamationTriangle, FaCheckCircle, 
  FaTimesCircle, FaChartBar, FaPlus, FaSearch, FaFilter 
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import InventoryList from '../components/InventoryManagement/InventoryList';

const InventoryPage = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:7000/api/inventory/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBasedNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: 'FaChartBar' },
      { name: 'Warehouse', href: '/warehouse', icon: 'FaWarehouse' }
    ];

    if (isAdmin() || isManager()) {
      baseNav.push({ name: 'Users', href: '/users', icon: 'FaUsers' });
    }

    if (isAdmin()) {
      baseNav.push({ name: 'Reports', href: '/reports', icon: 'FaChartLine' });
    }

    return baseNav;
  };

  const getRoleBasedQuickActions = () => {
    const actions = [];

    if (isAdmin() || isManager()) {
      actions.push({
        name: 'Add Inventory Item',
        description: 'Create a new inventory item',
        href: '#',
        icon: FaPlus,
        action: 'add-inventory'
      });
    }

    actions.push(
      {
        name: 'Search Inventory',
        description: 'Find specific items quickly',
        href: '#',
        icon: FaSearch,
        action: 'search'
      },
      {
        name: 'Filter Items',
        description: 'View items by category or status',
        href: '#',
        icon: FaFilter,
        action: 'filter'
      }
    );

    return actions;
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-inventory':
        // This will be handled by the InventoryList component
        break;
      case 'search':
        // Focus on search input
        break;
      case 'filter':
        // Show filter options
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <FaBoxes className="text-3xl text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-600">Manage your flour mill inventory efficiently</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome back, {user?.name || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Statistics Dashboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaChartBar className="mr-2 text-green-600" />
                Inventory Overview
              </h2>
              
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Items */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Items</p>
                        <p className="text-2xl font-bold">{stats.totalItems}</p>
                      </div>
                      <FaBoxes className="text-3xl opacity-80" />
                    </div>
                  </div>

                  {/* Low Stock Items */}
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Low Stock</p>
                        <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                      </div>
                      <FaExclamationTriangle className="text-3xl opacity-80" />
                    </div>
                  </div>

                  {/* Out of Stock Items */}
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Out of Stock</p>
                        <p className="text-2xl font-bold">{stats.outOfStockItems}</p>
                      </div>
                      <FaTimesCircle className="text-3xl opacity-80" />
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Value</p>
                        <p className="text-2xl font-bold">
                          PKR {stats.totalValue.toLocaleString()}
                        </p>
                      </div>
                      <FaCheckCircle className="text-3xl opacity-80" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getRoleBasedQuickActions().map((action) => (
                  <button
                    key={action.name}
                    onClick={() => handleQuickAction(action.action)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <action.icon className="text-green-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{action.name}</h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-lg shadow-md">
              <InventoryList />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
              <nav className="space-y-2">
                {getRoleBasedNavigation().map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <span className="text-gray-400">{item.name}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div className="text-sm">
                    <p className="text-gray-900">Inventory system updated</p>
                    <p className="text-gray-500 text-xs">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="text-sm">
                    <p className="text-gray-900">New items added</p>
                    <p className="text-gray-500 text-xs">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div className="text-sm">
                    <p className="text-gray-900">Low stock alerts</p>
                    <p className="text-gray-500 text-xs">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Items</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.totalItems - stats.outOfStockItems}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categories</span>
                  <span className="text-sm font-medium text-gray-900">6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Warehouses</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
