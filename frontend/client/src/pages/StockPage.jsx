import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  FaHome, FaPlus, FaBoxes, FaClipboardList,
  FaChartLine, FaWarehouse, FaSearch, FaExchangeAlt,
  FaExclamationTriangle, FaFilter, FaDownload, FaEdit, FaTrash, FaSync
} from "react-icons/fa";
import api, { API_ENDPOINTS } from "../services/api";
import StockForm from "../components/StockManagement/StockForm";
import StockList from "../components/StockManagement/StockList";
import StockStats from "../components/StockManagement/StockStats";
import StockTransfer from "../components/StockManagement/StockTransfer";
import StockAlerts from "../components/StockManagement/StockAlerts";

export default function StockPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for refreshing components

  const stockMenu = [
    { name: "Dashboard", icon: <FaChartLine className="mr-3" /> },
    { name: "Add Stock", icon: <FaPlus className="mr-3" /> },
    { name: "Stock List", icon: <FaBoxes className="mr-3" /> },
    { name: "Stock Transfer", icon: <FaExchangeAlt className="mr-3" /> },
    { name: "Low Stock Alerts", icon: <FaExclamationTriangle className="mr-3" /> },
    { name: "Stock Reports", icon: <FaClipboardList className="mr-3" /> }
  ];

  const stockActions = [
    { name: "Add Stock", icon: <FaPlus />, action: () => setActiveMenu("Add Stock"), color: "bg-blue-500" },
    { name: "View All", icon: <FaBoxes />, action: () => setActiveMenu("Stock List"), color: "bg-green-500" },
    { name: "Transfer", icon: <FaExchangeAlt />, action: () => setActiveMenu("Stock Transfer"), color: "bg-orange-500" },
    { name: "Alerts", icon: <FaExclamationTriangle />, action: () => setActiveMenu("Low Stock Alerts"), color: "bg-red-500" }
  ];

  useEffect(() => {
    loadStockData();
    loadAlerts();
    
    // Listen for custom stock update events (no automatic refresh)
    const handleStockUpdate = () => {
      console.log("StockPage: Received stock update event, refreshing data...");
      refreshAllData();
    };
    
    // Listen for inventory update events as well
    const handleInventoryUpdate = () => {
      console.log("StockPage: Received inventory update event, refreshing data...");
      refreshAllData();
    };
    
    window.addEventListener('stockUpdated', handleStockUpdate);
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    
    return () => {
      window.removeEventListener('stockUpdated', handleStockUpdate);
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  const loadStockData = async () => {
    setLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.STOCK.GET_ALL);
      if (response.data && response.data.success) {
        setStocks(response.data.data || []);
        console.log("Stock data loaded:", response.data.data?.length || 0, "movements");
      } else {
        console.error("Invalid response structure:", response.data);
        setStocks([]);
      }
    } catch (error) {
      console.error("Error loading stock data:", error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive refresh function for all stock operations
  const refreshAllData = async () => {
    console.log("StockPage: refreshAllData called - refreshing all stock data...");
    setLoading(true);
    try {
      await Promise.all([
        loadStockData(),
        loadAlerts()
      ]);
      // Trigger refresh for all components
      console.log("StockPage: Incrementing refreshTrigger from", refreshTrigger, "to", refreshTrigger + 1);
      setRefreshTrigger(prev => prev + 1);
      console.log("StockPage: All stock data refreshed successfully");
    } catch (error) {
      console.error("StockPage: Error refreshing stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.INVENTORY.LOW_STOCK);
      if (response.data && response.data.success) {
        const lowStockItems = response.data.data || [];
        const alerts = lowStockItems.map(item => ({
          id: item._id,
          type: "low_stock",
          message: `${item.name} is running low (${item.currentStock} ${item.unit} remaining)`,
          itemName: item.name,
          severity: "warning",
          date: new Date()
        }));
        setAlerts(alerts);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAlerts([]);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "Dashboard":
        return <StockStats key={`stockstats-${refreshTrigger}`} stocks={stocks} alerts={alerts} onDataRefresh={refreshAllData} refreshTrigger={refreshTrigger} />;
      case "Add Stock":
        return <StockForm onStockAdded={refreshAllData} />;
      case "Stock List":
        return <StockList stocks={stocks} onStockUpdate={refreshAllData} />;
      case "Stock Transfer":
        return <StockTransfer stocks={stocks} onTransferComplete={refreshAllData} />;
      case "Low Stock Alerts":
        return <StockAlerts alerts={alerts} stocks={stocks} onDataRefresh={refreshAllData} />;
      default:
        return <StockStats key={`stockstats-${refreshTrigger}`} stocks={stocks} alerts={alerts} onDataRefresh={refreshAllData} refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
         style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="mr-2" />
                Back to Dashboard
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={refreshAllData}
              className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              title="Refresh Stock Data"
            >
              <FaSync className="text-lg" />
            </button>
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaWarehouse className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">STOCK MANAGEMENT</h3>
            <ul className="space-y-1">
              {stockMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveMenu(item.name)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeMenu === item.name 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1 p-6 w-full">
          {activeMenu !== "Dashboard" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 w-full">
                {stockActions.map((button, index) => (
                  <button
                    key={index}
                    onClick={button.action}
                  className={`flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:bg-blue-50 group border border-gray-100 ${
                    activeMenu === button.name ? 'ring-2 ring-blue-500' : ''
                  }`}
                  >
                  <div className={`p-3 mb-2 rounded-full ${button.color} text-white group-hover:scale-110 transition-transform`}>
                      {button.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{button.name}</span>
                  </button>
                ))}
              </div>
          )}

              <div className="bg-white rounded-xl shadow-sm p-6 w-full">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderContent()
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
