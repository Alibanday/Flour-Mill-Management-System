import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import {
  FaHome, FaBoxes,
  FaChartLine, FaWarehouse, FaSearch, FaExchangeAlt,
  FaExclamationTriangle, FaFilter, FaDownload, FaEdit, FaTrash, FaSync
} from "react-icons/fa";
import api, { API_ENDPOINTS } from "../services/api";
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import StockList from "../components/StockManagement/StockList";
import StockStats from "../components/StockManagement/StockStats";
import StockAlerts from "../components/StockManagement/StockAlerts";
import StockTransferForm from '../components/StockTransfer/StockTransferForm';
import StockTransferList from '../components/StockTransfer/StockTransferList';
import StockTransferStats from '../components/StockTransfer/StockTransferStats';

export default function StockPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for refreshing components
  const [warehouses, setWarehouses] = useState([]);

  // Stock transfer state
  const [stockTransfers, setStockTransfers] = useState([]);
  const [stockTransferStats, setStockTransferStats] = useState(null);
  const [stockTransferLoading, setStockTransferLoading] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stockTransferFilters, setStockTransferFilters] = useState({
    search: '',
    status: '',
    fromWarehouse: '',
    toWarehouse: '',
    transferType: ''
  });
  const [stockTransferPagination, setStockTransferPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const stockMenu = [
    { name: "Dashboard", icon: <FaChartLine className="mr-3" /> },
    { name: "Stock List", icon: <FaBoxes className="mr-3" /> },
    { name: "Stock Transfer", icon: <FaExchangeAlt className="mr-3" /> },
    { name: "Low Stock Alerts", icon: <FaExclamationTriangle className="mr-3" /> }
  ];

  const stockActions = [
    { name: "View All", icon: <FaBoxes />, action: () => setActiveMenu("Stock List"), color: "bg-green-500" },
    { name: "Transfer", icon: <FaExchangeAlt />, action: () => setActiveMenu("Stock Transfer"), color: "bg-orange-500" },
    { name: "Alerts", icon: <FaExclamationTriangle />, action: () => setActiveMenu("Low Stock Alerts"), color: "bg-red-500" }
  ];

  useEffect(() => {
    loadStockData();
    loadAlerts();
    loadWarehouses();
    
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

  // Load stock transfers when Stock Transfer menu is active
  useEffect(() => {
    if (activeMenu === 'Stock Transfer') {
      fetchStockTransfers();
      fetchStockTransferStats();
      fetchInventoryItems();
    }
  }, [activeMenu, stockTransferFilters, stockTransferPagination.page]);

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

  const loadWarehouses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_ALL);
      if (response.data && response.data.success) {
        setWarehouses(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  // Stock transfer functions
  const normalizeTransfer = (transfer) => {
    const fromWarehouseId = typeof transfer.fromWarehouse === 'object' ? transfer.fromWarehouse?._id : transfer.fromWarehouse;
    const toWarehouseId = typeof transfer.toWarehouse === 'object' ? transfer.toWarehouse?._id : transfer.toWarehouse;

    return {
      ...transfer,
      fromWarehouse: fromWarehouseId,
      toWarehouse: toWarehouseId,
      transferDetails: transfer.transferDetails || {},
      priority: transfer.transferDetails?.priority || transfer.priority || 'Normal',
      expectedDate: transfer.transferDetails?.expectedDeliveryDate || transfer.transferDetails?.transferDate || transfer.expectedDate,
      items: (transfer.items || []).map(item => ({
        ...item,
        quantity: item.requestedQuantity ?? item.actualQuantity ?? item.quantity ?? 0
      }))
    };
  };

  const mapInventoryItems = (items = []) => {
    return items.map(item => {
      const warehouseId = typeof item.warehouse === 'object' ? item.warehouse?._id : item.warehouse;
      const warehouseName = typeof item.warehouse === 'object' ? item.warehouse?.name : warehouses.find(w => w._id === warehouseId)?.name;
      return {
        _id: item._id,
        name: item.name || item.product?.name || 'Unnamed Item',
        warehouse: warehouseId,
        warehouseName: warehouseName || 'Unassigned',
        quantity: item.currentStock ?? item.weight ?? 0,
        unit: item.unit || item.product?.unit || 'units',
        status: item.status || (item.currentStock === 0 ? 'Out of Stock' : (item.minimumStock && item.currentStock <= item.minimumStock ? 'Low Stock' : 'Active')),
        category: item.category || item.product?.category || 'Uncategorized',
        minimumStock: item.minimumStock || 0
      };
    });
  };

  const fetchStockTransfers = async () => {
    if (activeMenu !== 'Stock Transfer') return;
    try {
      setStockTransferLoading(true);
      const params = new URLSearchParams({
        page: stockTransferPagination.page,
        limit: stockTransferPagination.limit
      });

      Object.entries(stockTransferFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await api.get(`${API_ENDPOINTS.STOCK_TRANSFERS}/all?${params.toString()}`);
      if (response.data.success) {
        const normalized = (response.data.data || []).map(normalizeTransfer);
        setStockTransfers(normalized);
        setStockTransferPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || normalized.length,
          totalPages: response.data.pagination?.totalPages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching stock transfers:', error);
      toast.error('Failed to load stock transfers');
    } finally {
      setStockTransferLoading(false);
    }
  };

  const fetchStockTransferStats = async () => {
    if (activeMenu !== 'Stock Transfer') return;
    try {
      const response = await api.get(`${API_ENDPOINTS.STOCK_TRANSFERS}/stats/overview`);
      if (response.data.success) {
        setStockTransferStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching transfer stats:', error);
    }
  };

  const fetchInventoryItems = async () => {
    if (activeMenu !== 'Stock Transfer') return;
    try {
      const response = await api.get(API_ENDPOINTS.INVENTORY.GET_ALL);
      if (response.data.success) {
        setInventoryItems(mapInventoryItems(response.data.data || []));
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const handleCreateTransfer = async (transferData) => {
    try {
      const payload = {
        ...transferData,
        transferType: 'Warehouse to Warehouse',
        transferDetails: {
          transferDate: new Date(),
          expectedDeliveryDate: transferData.expectedDate,
          reason: transferData.reason,
          priority: 'Medium'
        },
        items: transferData.items.map(item => ({
          inventoryItem: item.itemId,
          productName: item.itemName,
          productCode: item.itemName?.split(' ')?.[0] || item.itemId,
          requestedQuantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice || 0,
          totalValue: (item.unitPrice || 0) * item.quantity
        }))
      };

      const response = await api.post(`${API_ENDPOINTS.STOCK_TRANSFERS}/create`, payload);
      if (response.data.success) {
        toast.success('Stock transfer created successfully');
        setShowTransferForm(false);
        fetchStockTransfers();
        fetchStockTransferStats();
        refreshAllData();
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to create stock transfer');
    }
  };

  const handleTransferAction = async (id, action, data = {}) => {
    try {
      const endpointMap = {
        approve: `${API_ENDPOINTS.STOCK_TRANSFERS}/${id}/approve`,
        dispatch: `${API_ENDPOINTS.STOCK_TRANSFERS}/${id}/dispatch`,
        receive: `${API_ENDPOINTS.STOCK_TRANSFERS}/${id}/receive`,
        complete: `${API_ENDPOINTS.STOCK_TRANSFERS}/${id}/complete`,
        cancel: `${API_ENDPOINTS.STOCK_TRANSFERS}/${id}/cancel`
      };
      const method = action === 'cancel' ? 'patch' : 'patch';
      await api[method](endpointMap[action], data);
      toast.success(`Transfer ${action}d successfully`);
      fetchStockTransfers();
      fetchStockTransferStats();
      refreshAllData();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} transfer`);
    }
  };

  const handleTransferFilterChange = (newFilters) => {
    setStockTransferFilters(prev => ({ ...prev, ...newFilters }));
    setStockTransferPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTransferPageChange = (page) => {
    setStockTransferPagination(prev => ({ ...prev, page }));
  };

  const hasRolePermission = (roles = []) => {
    if (!roles.length) return true;
    return roles.some(role => {
      switch (role) {
        case 'Admin':
          return isAdmin();
        case 'Manager':
          return isManager();
        case 'Employee':
          return isEmployee();
        default:
          return false;
      }
    });
  };

  const stockTransferSummary = useMemo(() => {
    if (!stockTransferStats) {
      return {
        totalTransfers: 0,
        pendingTransfers: 0,
        inTransitTransfers: 0,
        completedToday: 0,
        urgentTransfers: 0,
        averageProcessingTime: 'N/A'
      };
    }
    const breakdown = {};
    (stockTransferStats.statusBreakdown || []).forEach(item => {
      breakdown[item._id] = item.count;
    });
    return {
      totalTransfers: stockTransferStats.totalTransfers || 0,
      pendingTransfers: breakdown.Pending || 0,
      inTransitTransfers: breakdown['In Transit'] || breakdown.Dispatched || 0,
      completedToday: stockTransferStats.completedToday || 0,
      urgentTransfers: stockTransferStats.urgentTransfers || 0,
      averageProcessingTime: stockTransferStats.averageProcessingTime || 'N/A'
    };
  }, [stockTransferStats]);

  const renderStockTransferSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Transfer</h2>
          <p className="text-gray-600">Create and monitor stock transfers across warehouses</p>
        </div>
        {hasRolePermission(['Admin', 'Manager', 'Employee']) && (
          <button
            onClick={() => setShowTransferForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Transfer
          </button>
        )}
      </div>

      <StockTransferStats stats={stockTransferSummary} />

      <StockTransferList
        transfers={stockTransfers}
        loading={stockTransferLoading}
        filters={stockTransferFilters}
        pagination={{ ...stockTransferPagination, limit: stockTransferPagination.limit }}
        warehouses={warehouses}
        onApprove={(id, data) => handleTransferAction(id, 'approve', { approvalNotes: data.notes })}
        onDispatch={(id, data) => handleTransferAction(id, 'dispatch', { dispatchNotes: data.notes, vehicleNumber: data.vehicleNumber })}
        onReceive={(id, data) => {
          const transfer = stockTransfers.find(t => t._id === id);
          const receivedItems = (transfer?.items || []).map(item => ({
            inventoryItem: item.inventoryItem?._id || item.inventoryItem,
            actualQuantity: item.quantity
          }));
          handleTransferAction(id, 'receive', { receivedItems, receiptNotes: data.notes });
        }}
        onComplete={(id) => handleTransferAction(id, 'complete')}
        onCancel={(id, reason) => handleTransferAction(id, 'cancel', { reason })}
        onFilterChange={handleTransferFilterChange}
        onPageChange={handleTransferPageChange}
        hasPermission={hasRolePermission}
      />

      {showTransferForm && (
        <StockTransferForm
          warehouses={warehouses}
          inventory={inventoryItems}
          onSubmit={handleCreateTransfer}
          onClose={() => setShowTransferForm(false)}
        />
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case "Dashboard":
        return <StockStats key={`stockstats-${refreshTrigger}`} stocks={stocks} alerts={alerts} onDataRefresh={refreshAllData} refreshTrigger={refreshTrigger} />;
      case "Stock List":
        return <StockList stocks={stocks} onStockUpdate={refreshAllData} />;
      case "Stock Transfer":
        return renderStockTransferSection();
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
