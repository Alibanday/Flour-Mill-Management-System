import React, { useState, useEffect } from "react";
import { FaBoxes, FaExclamationTriangle, FaWarehouse, FaChartLine, FaDollarSign, FaSync } from "react-icons/fa";
import api, { API_ENDPOINTS } from "../../services/api";

export default function StockStats({ stocks, alerts, onDataRefresh, refreshTrigger }) {
  console.log("StockStats rendered with:", { refreshTrigger, stocksLength: stocks?.length, alertsLength: alerts?.length });
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    outOfStockItems: 0,
    availableItems: 0
  });
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Refresh data when refreshTrigger changes (this ensures dashboard updates after stock operations)
  useEffect(() => {
    console.log("StockStats: refreshTrigger changed to:", refreshTrigger);
    if (refreshTrigger > 0) {
      console.log("StockStats: Refreshing dashboard due to stock operation...");
      fetchInventoryData();
    }
  }, [refreshTrigger]);

  // Only refresh when stocks array changes if it's a meaningful change
  useEffect(() => {
    console.log("StockStats: stocks array changed, length:", stocks?.length);
    // Only refresh if we have stocks and it's a significant change
    if (stocks && stocks.length > 0) {
      console.log("StockStats: Refreshing dashboard after stocks change...");
      fetchInventoryData();
    }
  }, [stocks?.length]);

  // Listen for custom events to trigger refresh
  useEffect(() => {
    const handleStockUpdate = () => {
      console.log("StockStats: Received stock update event, refreshing...");
      fetchInventoryData();
    };

    const handleInventoryUpdate = () => {
      console.log("StockStats: Received inventory update event, refreshing...");
      fetchInventoryData();
    };

    window.addEventListener('stockUpdated', handleStockUpdate);
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);

    return () => {
      window.removeEventListener('stockUpdated', handleStockUpdate);
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  // Add a direct refresh function that can be called from parent
  const handleDirectRefresh = async () => {
    console.log("StockStats: Direct refresh called");
    await fetchInventoryData();
  };

  const fetchInventoryData = async () => {
    try {
      console.log("StockStats: Starting to fetch inventory data...");
      setLoading(true);
      
      // Fetch both inventory summary and inventory list
      const [summaryResponse, inventoryResponse] = await Promise.all([
        api.get(API_ENDPOINTS.INVENTORY.SUMMARY),
        api.get(API_ENDPOINTS.INVENTORY.GET_ALL)
      ]);
      
      if (summaryResponse.data.success) {
        const summaryData = summaryResponse.data.data;
        setInventoryStats({
          totalItems: summaryData.totalItems || 0,
          totalValue: summaryData.totalValue || 0,
          outOfStockItems: summaryData.outOfStockItems || 0,
          availableItems: summaryData.activeItems || 0
        });
        console.log("StockStats: Inventory summary loaded:", summaryData);
      }
      
      if (inventoryResponse.data.success) {
        setInventoryData(inventoryResponse.data.data || []);
        console.log("StockStats: Inventory list loaded:", inventoryResponse.data.data?.length || 0, "items");
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error("StockStats: Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group by category
  const categoryStats = inventoryData.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0, lowStock: 0 };
    }
    acc[category].count++;
    acc[category].value += (item.currentStock * (item.cost?.purchasePrice || 0));
    if (item.currentStock <= item.minimumStock) {
      acc[category].lowStock++;
    }
    return acc;
  }, {});

  // Group by warehouse
  const warehouseStats = inventoryData.reduce((acc, item) => {
    const warehouse = item.warehouse?.name || "Unknown";
    if (!acc[warehouse]) {
      acc[warehouse] = { count: 0, value: 0 };
    }
    acc[warehouse].count++;
    acc[warehouse].value += (item.currentStock * (item.cost?.purchasePrice || 0));
    return acc;
  }, {});

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Stock Dashboard</h2>
          <div className="text-sm text-gray-500">
            Loading...
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Stock Dashboard
          {loading && (
            <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          )}
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDirectRefresh}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaSync className="mr-2" />
            Refresh
          </button>
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {inventoryStats.outOfStockItems > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {inventoryStats.outOfStockItems} Alert{inventoryStats.outOfStockItems > 1 ? 's' : ''} Require Attention
              </h3>
              <p className="text-sm text-red-700">
                {inventoryStats.outOfStockItems} out of stock items need attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={inventoryStats.totalItems}
          icon={<FaBoxes className="text-white" />}
          color="bg-blue-500"
          subtitle="Stock items"
        />
        <StatCard
          title="Total Value"
          value={`Rs. ${inventoryStats.totalValue.toLocaleString()}`}
          icon={<FaDollarSign className="text-white" />}
          color="bg-green-500"
          subtitle="Inventory value"
        />
        <StatCard
          title="Out of Stock Items"
          value={inventoryStats.outOfStockItems}
          icon={<FaExclamationTriangle className="text-white" />}
          color="bg-red-500"
          subtitle="Need attention"
        />
        <StatCard
          title="Available Items"
          value={inventoryStats.availableItems}
          icon={<FaWarehouse className="text-white" />}
          color="bg-purple-500"
          subtitle="Ready for use"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock by Category</h3>
          <div className="space-y-3">
            {Object.keys(categoryStats).length > 0 ? (
              Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{stats.count} items</div>
                    <div className="text-xs text-gray-500">Rs. {stats.value.toLocaleString()}</div>
                    {stats.lowStock > 0 && (
                      <div className="text-xs text-yellow-600">{stats.lowStock} low stock</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaBoxes className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No inventory items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock by Warehouse */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock by Warehouse</h3>
          <div className="space-y-3">
            {Object.keys(warehouseStats).length > 0 ? (
              Object.entries(warehouseStats).map(([warehouse, stats]) => (
                <div key={warehouse} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">{warehouse}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{stats.count} items</div>
                    <div className="text-xs text-gray-500">Rs. {stats.value.toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaWarehouse className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No warehouse data found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {inventoryStats.outOfStockItems > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {inventoryData
              .filter(item => item.weight === 0)
              .slice(0, 5)
              .map((item) => (
                <div key={item._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full mr-3 bg-red-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.name} is out of stock (0 kg remaining)
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    out of stock
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <FaBoxes className="text-blue-600 text-xl mb-2" />
            <span className="text-sm font-medium text-blue-800">Add Stock</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <FaChartLine className="text-green-600 text-xl mb-2" />
            <span className="text-sm font-medium text-green-800">View Reports</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <FaExclamationTriangle className="text-yellow-600 text-xl mb-2" />
            <span className="text-sm font-medium text-yellow-800">Low Stock</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <FaWarehouse className="text-purple-600 text-xl mb-2" />
            <span className="text-sm font-medium text-purple-800">Transfer</span>
          </button>
        </div>
      </div>
    </div>
  );
}