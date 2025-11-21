import React, { useState, useEffect } from "react";
import { FaExclamationTriangle, FaWarehouse, FaDollarSign, FaSync, FaSeedling, FaShoppingBag } from "react-icons/fa";
import api, { API_ENDPOINTS } from "../../services/api";

export default function StockStats({ stocks, alerts, onDataRefresh, refreshTrigger }) {
  console.log("StockStats rendered with:", { refreshTrigger, stocksLength: stocks?.length, alertsLength: alerts?.length });
  const [stockDashboard, setStockDashboard] = useState({
    totalWheat: 0,
    totalBags: {
      ata: 0,
      maida: 0,
      suji: 0,
      fine: 0,
      total: 0
    },
    totalValue: 0,
    warehouses: []
  });
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
      console.log("StockStats: Starting to fetch stock dashboard data...");
      setLoading(true);
      
      // Fetch stock dashboard data (aggregated from all warehouses)
      const dashboardResponse = await api.get(API_ENDPOINTS.INVENTORY.DASHBOARD);
      
      if (dashboardResponse.data && dashboardResponse.data.success) {
        const dashboardData = dashboardResponse.data.data || {};
        setStockDashboard({
          totalWheat: dashboardData.totalWheat || 0,
          totalBags: dashboardData.totalBags || { ata: 0, maida: 0, suji: 0, fine: 0, total: 0 },
          totalValue: dashboardData.totalValue || 0,
          warehouses: dashboardData.warehouses || []
        });
        console.log("StockStats: Stock dashboard loaded:", dashboardResponse.data.data);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error("StockStats: Error fetching stock dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Key Statistics - Stock Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Wheat Stock"
          value={`${stockDashboard.totalWheat.toLocaleString()} kg`}
          icon={<FaSeedling className="text-white" />}
          color="bg-amber-500"
          subtitle="Raw materials from all warehouses"
        />
        <StatCard
          title="Total Bags"
          value={stockDashboard.totalBags.total.toLocaleString()}
          icon={<FaShoppingBag className="text-white" />}
          color="bg-blue-500"
          subtitle="Finished goods from all warehouses"
        />
        <StatCard
          title="Total Value"
          value={`Rs. ${stockDashboard.totalValue.toLocaleString()}`}
          icon={<FaDollarSign className="text-white" />}
          color="bg-green-500"
          subtitle="Total inventory value"
        />
        <StatCard
          title="Total Warehouses"
          value={stockDashboard.warehouses.length}
          icon={<FaWarehouse className="text-white" />}
          color="bg-purple-500"
          subtitle="Active warehouses"
        />
      </div>

      {/* Bags Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bags Inventory Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">ATA Bags</p>
            <p className="text-2xl font-bold text-blue-600">{stockDashboard.totalBags.ata.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">MAIDA Bags</p>
            <p className="text-2xl font-bold text-purple-600">{stockDashboard.totalBags.maida.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">SUJI Bags</p>
            <p className="text-2xl font-bold text-green-600">{stockDashboard.totalBags.suji.toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">FINE Bags</p>
            <p className="text-2xl font-bold text-orange-600">{stockDashboard.totalBags.fine.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Warehouse Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock by Warehouse</h3>
        <div className="space-y-4">
          {stockDashboard.warehouses.length > 0 ? (
            stockDashboard.warehouses.map((warehouse) => (
              <div key={warehouse._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FaWarehouse className="text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{warehouse.name}</h4>
                      {warehouse.warehouseNumber && (
                        <p className="text-xs text-gray-500">#{warehouse.warehouseNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">Rs. {warehouse.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Value</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-1">Wheat Stock</p>
                    <p className="text-lg font-bold text-amber-600">{warehouse.wheat.toLocaleString()} kg</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Bags</p>
                    <p className="text-lg font-bold text-blue-600">{warehouse.bags.total.toLocaleString()}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="text-blue-700">ATA: {warehouse.bags.ata}</span>
                      <span className="text-purple-700">MAIDA: {warehouse.bags.maida}</span>
                      <span className="text-green-700">SUJI: {warehouse.bags.suji}</span>
                      <span className="text-orange-700">FINE: {warehouse.bags.fine}</span>
                    </div>
                  </div>
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
  );
}