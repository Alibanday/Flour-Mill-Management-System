import React, { useState, useEffect } from "react";
import { FaExclamationTriangle, FaInfoCircle, FaTimes, FaCheck, FaPlus } from "react-icons/fa";
import api, { API_ENDPOINTS } from "../../services/api";

export default function StockAlerts({ alerts, stocks, onDataRefresh }) {
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restockForm, setRestockForm] = useState({
    quantity: "",
    reason: "",
    referenceNumber: ""
  });
  const [restockLoading, setRestockLoading] = useState(false);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  // Refresh data when onDataRefresh is called
  useEffect(() => {
    if (onDataRefresh) {
      const refreshData = async () => {
        console.log("StockAlerts: Refreshing alerts data...");
        await fetchLowStockItems();
      };
      refreshData();
    }
  }, [onDataRefresh]);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.INVENTORY.LOW_STOCK);
      if (response.data && response.data.success) {
        setInventoryAlerts(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (itemId) => {
    setInventoryAlerts(prev => prev.filter(alert => alert._id !== itemId));
  };

  const handleRestockItem = (itemId) => {
    const itemToRestock = inventoryAlerts.find(item => item._id === itemId);
    if (!itemToRestock) {
      console.error("Item not found for restocking");
      return;
    }

    setSelectedItem(itemToRestock);
    const suggestedQuantity = Math.max(itemToRestock.minimumStock * 2, 100);
    setRestockForm({
      quantity: suggestedQuantity.toString(),
      reason: `Restock - ${itemToRestock.name} was running low`,
      referenceNumber: `RESTOCK-${Date.now()}`
    });
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !restockForm.quantity || !restockForm.reason) {
      alert("Please fill in all required fields");
      return;
    }

    setRestockLoading(true);

    try {
      console.log("Restock form data:", restockForm);
      console.log("Selected item:", selectedItem);
      
      // Create stock in movement
      const stockData = {
        inventoryItem: selectedItem._id,
        movementType: "in",
        quantity: parseFloat(restockForm.quantity),
        reason: restockForm.reason,
        referenceNumber: restockForm.referenceNumber,
        warehouse: selectedItem.warehouse?._id || selectedItem.warehouse
      };

      console.log("Sending restock data:", stockData);
      console.log("API endpoint:", API_ENDPOINTS.STOCK.ADD);

      const response = await api.post(API_ENDPOINTS.STOCK.ADD, stockData);
      
      console.log("Restock API response:", response.data);
      
      if (response.data && response.data.success) {
        // Remove from alerts
        handleDismissAlert(selectedItem._id);
        
        // Close modal and reset form
        setShowRestockModal(false);
        setSelectedItem(null);
        setRestockForm({ quantity: "", reason: "", referenceNumber: "" });
        
        // Refresh all data
        if (onDataRefresh) {
          onDataRefresh();
        }
        
        alert(`Successfully restocked ${selectedItem.name} with ${restockForm.quantity} ${selectedItem.unit}`);
      } else {
        throw new Error(response.data?.message || "Failed to restock item");
      }
    } catch (error) {
      console.error("Error restocking item:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to restock item";
      alert(`Error restocking item: ${errorMessage}`);
    } finally {
      setRestockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Stock Alerts</h2>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Stock Alerts</h2>
        <div className="text-sm text-gray-500">
          {inventoryAlerts.length} alert{inventoryAlerts.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Alert Summary */}
      {inventoryAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                {inventoryAlerts.length} Item{inventoryAlerts.length > 1 ? 's' : ''} Need Attention
              </h3>
              <p className="text-sm text-yellow-700">
                These items are running low on stock and may need to be reordered
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {inventoryAlerts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {inventoryAlerts.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <FaExclamationTriangle className="text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <span className="ml-2 text-sm text-gray-500">({item.code})</span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          Current Stock: <span className="font-medium text-yellow-600">{item.currentStock} {item.unit}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Minimum Stock: {item.minimumStock} {item.unit}
                        </p>
                        {item.warehouse && (
                          <p className="text-sm text-gray-500">
                            Warehouse: {item.warehouse.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRestockItem(item._id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FaCheck className="mr-1" />
                      Restock
                    </button>
                    <button
                      onClick={() => handleDismissAlert(item._id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaTimes className="mr-1" />
                      Dismiss
                    </button>
                  </div>
                </div>
                
                {/* Stock Level Indicator */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Stock Level</span>
                    <span>{Math.round((item.currentStock / (item.maximumStock || item.minimumStock * 2)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((item.currentStock / (item.maximumStock || item.minimumStock * 2)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaCheck className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts</h3>
            <p className="text-gray-500">All inventory items are at healthy stock levels</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <FaExclamationTriangle className="text-blue-600 text-xl mr-3" />
            <div className="text-left">
              <div className="font-medium text-blue-800">View All Low Stock</div>
              <div className="text-sm text-blue-600">See all items that need attention</div>
            </div>
          </button>
          <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <FaCheck className="text-green-600 text-xl mr-3" />
            <div className="text-left">
              <div className="font-medium text-green-800">Bulk Restock</div>
              <div className="text-sm text-green-600">Restock multiple items at once</div>
            </div>
          </button>
          <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <FaInfoCircle className="text-purple-600 text-xl mr-3" />
            <div className="text-left">
              <div className="font-medium text-purple-800">Set Alerts</div>
              <div className="text-sm text-purple-600">Configure stock level alerts</div>
            </div>
          </button>
        </div>
      </div>

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Restock Item</h3>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">{selectedItem.name}</h4>
              <p className="text-sm text-blue-600">
                Current: {selectedItem.currentStock} {selectedItem.unit} | 
                Minimum: {selectedItem.minimumStock} {selectedItem.unit}
              </p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restock Quantity *
                </label>
                <input
                  type="number"
                  value={restockForm.quantity}
                  onChange={(e) => setRestockForm({...restockForm, quantity: e.target.value})}
                  required
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity to restock"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: {Math.max(selectedItem.minimumStock * 2, 100)} {selectedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <input
                  type="text"
                  value={restockForm.reason}
                  onChange={(e) => setRestockForm({...restockForm, reason: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Why are you restocking this item?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={restockForm.referenceNumber}
                  onChange={(e) => setRestockForm({...restockForm, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Purchase order, invoice, etc."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <FaPlus />
                  <span>{restockLoading ? "Restocking..." : "Restock"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}