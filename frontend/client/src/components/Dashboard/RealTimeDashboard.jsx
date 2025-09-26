import React, { useState, useEffect } from 'react';
import { 
  FaWarehouse, 
  FaBoxes, 
  FaChartLine, 
  FaShoppingCart, 
  FaIndustry, 
  FaBell,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';
import eventSystem from '../../utils/eventSystem';

const RealTimeDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    inventory: { totalItems: 0, totalValue: 0, lowStock: 0, outOfStock: 0 },
    stock: { totalMovements: 0, inMovements: 0, outMovements: 0 },
    production: { totalBatches: 0, totalQuantity: 0, totalCost: 0 },
    sales: { totalSales: 0, totalRevenue: 0, pendingPayments: 0 },
    purchase: { totalPurchases: 0, totalAmount: 0, pendingOrders: 0 },
    warehouse: { totalWarehouses: 0, activeWarehouses: 0, capacityAlerts: 0 },
    notifications: { total: 0, unread: 0, critical: 0 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [realTimeStatus, setRealTimeStatus] = useState('connected');

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();

    // Setup event listeners for real-time updates
    eventSystem.on('dashboard:data', handleDashboardData);
    eventSystem.on('dashboard:refresh', handleModuleRefresh);
    eventSystem.on('inventory:updated', handleInventoryUpdate);
    eventSystem.on('stock:updated', handleStockUpdate);
    eventSystem.on('production:updated', handleProductionUpdate);
    eventSystem.on('sales:updated', handleSalesUpdate);
    eventSystem.on('purchase:updated', handlePurchaseUpdate);
    eventSystem.on('warehouse:updated', handleWarehouseUpdate);
    eventSystem.on('notification:received', handleNotificationReceived);

    // Setup periodic refresh
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
      // Cleanup event listeners
      eventSystem.off('dashboard:data', handleDashboardData);
      eventSystem.off('dashboard:refresh', handleModuleRefresh);
      eventSystem.off('inventory:updated', handleInventoryUpdate);
      eventSystem.off('stock:updated', handleStockUpdate);
      eventSystem.off('production:updated', handleProductionUpdate);
      eventSystem.off('sales:updated', handleSalesUpdate);
      eventSystem.off('purchase:updated', handlePurchaseUpdate);
      eventSystem.off('warehouse:updated', handleWarehouseUpdate);
      eventSystem.off('notification:received', handleNotificationReceived);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/real-time', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdated(new Date());
        setRealTimeStatus('connected');
      } else {
        setRealTimeStatus('disconnected');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setRealTimeStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDashboardData = (data) => {
    setDashboardData(data);
    setLastUpdated(new Date());
  };

  const handleModuleRefresh = (event) => {
    const { module } = event.detail;
    console.log(`Refreshing ${module} module data`);
    fetchDashboardData();
  };

  const handleInventoryUpdate = (data) => {
    console.log('Inventory updated in dashboard:', data);
    // Trigger inventory data refresh
    fetchDashboardData();
  };

  const handleStockUpdate = (data) => {
    console.log('Stock updated in dashboard:', data);
    // Trigger stock data refresh
    fetchDashboardData();
  };

  const handleProductionUpdate = (data) => {
    console.log('Production updated in dashboard:', data);
    // Trigger production data refresh
    fetchDashboardData();
  };

  const handleSalesUpdate = (data) => {
    console.log('Sales updated in dashboard:', data);
    // Trigger sales data refresh
    fetchDashboardData();
  };

  const handlePurchaseUpdate = (data) => {
    console.log('Purchase updated in dashboard:', data);
    // Trigger purchase data refresh
    fetchDashboardData();
  };

  const handleWarehouseUpdate = (data) => {
    console.log('Warehouse updated in dashboard:', data);
    // Trigger warehouse data refresh
    fetchDashboardData();
  };

  const handleNotificationReceived = (data) => {
    console.log('Notification received in dashboard:', data);
    // Update notification count
    setDashboardData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        total: prev.notifications.total + 1,
        unread: prev.notifications.unread + 1,
        critical: data.priority === 'critical' ? prev.notifications.critical + 1 : prev.notifications.critical
      }
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <FaCheckCircle className="text-green-500" />;
      case 'disconnected': return <FaClock className="text-yellow-500" />;
      case 'error': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaSync className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Dashboard</h1>
          <p className="text-gray-600">Live updates across all modules</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(realTimeStatus)}
            <span className={`text-sm font-medium ${getStatusColor(realTimeStatus)}`}>
              {realTimeStatus.charAt(0).toUpperCase() + realTimeStatus.slice(1)}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaSync className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Inventory Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
              <p className="text-sm text-gray-600">Total Items & Value</p>
            </div>
            <FaBoxes className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Items:</span>
              <span className="font-semibold">{dashboardData.inventory.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Value:</span>
              <span className="font-semibold">PKR {dashboardData.inventory.totalValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Low Stock:</span>
              <span className="font-semibold text-yellow-600">{dashboardData.inventory.lowStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Out of Stock:</span>
              <span className="font-semibold text-red-600">{dashboardData.inventory.outOfStock}</span>
            </div>
          </div>
        </div>

        {/* Stock Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stock Movements</h3>
              <p className="text-sm text-gray-600">In & Out Movements</p>
            </div>
            <FaChartLine className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Movements:</span>
              <span className="font-semibold">{dashboardData.stock.totalMovements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Stock In:</span>
              <span className="font-semibold text-green-600">{dashboardData.stock.inMovements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Stock Out:</span>
              <span className="font-semibold text-red-600">{dashboardData.stock.outMovements}</span>
            </div>
          </div>
        </div>

        {/* Production Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Production</h3>
              <p className="text-sm text-gray-600">Batches & Output</p>
            </div>
            <FaIndustry className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Batches:</span>
              <span className="font-semibold">{dashboardData.production.totalBatches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Quantity:</span>
              <span className="font-semibold">{dashboardData.production.totalQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Cost:</span>
              <span className="font-semibold">PKR {dashboardData.production.totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Sales Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales</h3>
              <p className="text-sm text-gray-600">Revenue & Orders</p>
            </div>
            <FaShoppingCart className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Sales:</span>
              <span className="font-semibold">{dashboardData.sales.totalSales}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Revenue:</span>
              <span className="font-semibold">PKR {dashboardData.sales.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Payments:</span>
              <span className="font-semibold text-yellow-600">{dashboardData.sales.pendingPayments}</span>
            </div>
          </div>
        </div>

        {/* Purchase Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Purchases</h3>
              <p className="text-sm text-gray-600">Orders & Spending</p>
            </div>
            <FaShoppingCart className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Purchases:</span>
              <span className="font-semibold">{dashboardData.purchase.totalPurchases}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="font-semibold">PKR {dashboardData.purchase.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Orders:</span>
              <span className="font-semibold text-yellow-600">{dashboardData.purchase.pendingOrders}</span>
            </div>
          </div>
        </div>

        {/* Warehouse Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Warehouses</h3>
              <p className="text-sm text-gray-600">Capacity & Status</p>
            </div>
            <FaWarehouse className="w-8 h-8 text-teal-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Warehouses:</span>
              <span className="font-semibold">{dashboardData.warehouse.totalWarehouses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active:</span>
              <span className="font-semibold text-green-600">{dashboardData.warehouse.activeWarehouses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Capacity Alerts:</span>
              <span className="font-semibold text-red-600">{dashboardData.warehouse.capacityAlerts}</span>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Alerts & Messages</p>
            </div>
            <FaBell className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-semibold">{dashboardData.notifications.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Unread:</span>
              <span className="font-semibold text-yellow-600">{dashboardData.notifications.unread}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Critical:</span>
              <span className="font-semibold text-red-600">{dashboardData.notifications.critical}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dashboardData.inventory.totalItems}</div>
            <div className="text-sm text-gray-600">Inventory Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dashboardData.stock.totalMovements}</div>
            <div className="text-sm text-gray-600">Stock Movements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dashboardData.production.totalBatches}</div>
            <div className="text-sm text-gray-600">Production Batches</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
