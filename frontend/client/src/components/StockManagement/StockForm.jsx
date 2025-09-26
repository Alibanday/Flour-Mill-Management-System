import React, { useState, useEffect } from "react";
import { FaSave, FaTimes, FaInfoCircle, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import api, { API_ENDPOINTS } from "../../services/api";

export default function StockForm({ onStockAdded }) {
  const [form, setForm] = useState({
    inventoryItem: "",
    movementType: "in",
    quantity: "",
    reason: "",
    referenceNumber: "",
    warehouse: ""
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchInventoryItems();
    fetchWarehouses();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.INVENTORY.GET_ALL);
      if (response.data && response.data.success) {
        setInventoryItems(response.data.data || []);
        console.log("Inventory items loaded:", response.data.data?.length || 0, "items");
      } else {
        console.error("Invalid inventory response:", response.data);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      setInventoryItems([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_ALL);
      if (response.data && response.data.success) {
        setWarehouses(response.data.data || []);
        console.log("Warehouses loaded:", response.data.data?.length || 0, "warehouses");
      } else {
        console.error("Invalid warehouse response:", response.data);
        setWarehouses([]);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      setWarehouses([]);
    }
  };

  const movementTypes = [
    { value: "in", label: "Stock In" },
    { value: "out", label: "Stock Out" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setValidationErrors({});
    
    // Update selected item when inventory item changes
    if (name === 'inventoryItem') {
      const item = inventoryItems.find(i => i._id === value);
      setSelectedItem(item);
      
      // Auto-suggest warehouse if item has a current warehouse
      if (item && item.warehouse) {
        setForm(prev => ({
          ...prev,
          warehouse: item.warehouse._id || item.warehouse
        }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.inventoryItem) {
      errors.inventoryItem = "Please select an inventory item";
    }
    
    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      errors.quantity = "Please enter a valid quantity";
    }
    
    if (!form.warehouse) {
      errors.warehouse = "Please select a warehouse";
    }
    
    if (!form.reason || form.reason.trim().length < 3) {
      errors.reason = "Please provide a reason (at least 3 characters)";
    }
    
    // Check stock availability for 'out' movements
    if (form.movementType === 'out' && selectedItem) {
      const availableStock = selectedItem.currentStock || 0;
      const requestedQuantity = parseFloat(form.quantity) || 0;
      if (requestedQuantity > availableStock) {
        errors.quantity = `Insufficient stock. Available: ${availableStock} ${selectedItem.unit}`;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      console.log("Form data:", form);
      
      // Validate form
      if (!validateForm()) {
        console.log("Form validation failed");
        setLoading(false);
        return;
      }

      const stockData = {
        ...form,
        quantity: parseFloat(form.quantity)
      };

      console.log("Sending stock data:", stockData);
      console.log("API endpoint:", API_ENDPOINTS.STOCK.ADD);

      // Make API call with timeout
      const response = await Promise.race([
        api.post(API_ENDPOINTS.STOCK.ADD, stockData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      
      console.log("API response:", response.data);
      
      if (response.data && response.data.success) {
        setSuccess("Stock movement recorded successfully!");
        
        // Reset form
        setForm({
          inventoryItem: "",
          movementType: "in",
          quantity: "",
          reason: "",
          referenceNumber: "",
          warehouse: ""
        });
        setSelectedItem(null);
        setValidationErrors({});
        
        // Call refresh function
        if (onStockAdded) {
          console.log("Calling onStockAdded to refresh data...");
          onStockAdded();
        }
        
        // Trigger stock update event for real-time updates
        window.dispatchEvent(new CustomEvent('stockUpdated'));
        
        // Also trigger inventory update event since stock affects inventory
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
      } else {
        throw new Error(response.data?.message || "Failed to record stock movement");
      }

    } catch (err) {
      console.error("Stock form error:", err);
      const message = err.response?.data?.message || err.message || "Failed to record stock movement";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Record Stock Movement</h2>
        <button
          onClick={() => onStockAdded && onStockAdded()}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <FaTimes className="mr-2" />
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selected Item Info */}
        {selectedItem && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FaInfoCircle className="text-blue-600 mr-2" />
              <h3 className="text-sm font-semibold text-blue-800">Selected Item Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Stock:</span>
                <div className="font-semibold text-gray-800">{selectedItem.currentStock} {selectedItem.unit}</div>
              </div>
              <div>
                <span className="text-gray-600">Minimum Stock:</span>
                <div className="font-semibold text-gray-800">{selectedItem.minimumStock} {selectedItem.unit}</div>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <div className="font-semibold text-gray-800">{selectedItem.category}</div>
              </div>
              <div>
                <span className="text-gray-600">Current Warehouse:</span>
                <div className="font-semibold text-gray-800">{selectedItem.warehouse?.name || 'Not Assigned'}</div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <div className={`font-semibold ${
                  selectedItem.currentStock <= selectedItem.minimumStock 
                    ? 'text-red-600' 
                    : selectedItem.currentStock <= selectedItem.minimumStock * 1.5 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                }`}>
                  {selectedItem.currentStock <= selectedItem.minimumStock 
                    ? 'Low Stock' 
                    : selectedItem.currentStock <= selectedItem.minimumStock * 1.5 
                      ? 'Medium Stock' 
                      : 'Good Stock'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Movement Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inventory Item *
              </label>
              <select
                name="inventoryItem"
                value={form.inventoryItem}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.inventoryItem 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">Select Inventory Item</option>
                {inventoryItems.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.code}) - {item.currentStock} {item.unit}
                  </option>
                ))}
              </select>
              {validationErrors.inventoryItem && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {validationErrors.inventoryItem}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Movement Type *
              </label>
              <select
                name="movementType"
                value={form.movementType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {movementTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.quantity 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="Enter quantity"
                min="0"
                step="0.01"
                max={form.movementType === 'out' && selectedItem ? selectedItem.currentStock : undefined}
              />
              {validationErrors.quantity && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {validationErrors.quantity}
                </p>
              )}
              {form.movementType === 'out' && selectedItem && (
                <p className="mt-1 text-sm text-gray-500">
                  Available: {selectedItem.currentStock} {selectedItem.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse *
              </label>
              <select
                name="warehouse"
                value={form.warehouse}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.warehouse 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
              {validationErrors.warehouse && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {validationErrors.warehouse}
                </p>
              )}
              {selectedItem && selectedItem.warehouse && (
                <p className="mt-1 text-sm text-blue-600">
                  💡 Suggested: {selectedItem.warehouse.name} (current warehouse)
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <input
                type="text"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.reason 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="Why this movement occurred"
              />
              {validationErrors.reason && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {validationErrors.reason}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                name="referenceNumber"
                value={form.referenceNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Invoice, PO, etc."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={() => onStockAdded && onStockAdded()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaSave />
              )}
              <span>{loading ? 'Saving...' : 'Record Movement'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}