import React, { useState } from "react";
import { FaSearch, FaFilter, FaEdit, FaTrash, FaEye, FaDownload, FaTimes, FaSync, FaBoxes } from "react-icons/fa";
import api, { API_ENDPOINTS } from "../../services/api";

export default function StockList({ stocks, onStockUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("itemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedStock, setSelectedStock] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    reason: "",
    referenceNumber: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const categories = [
    "Raw Materials", "Finished Goods", "Wheat", "Flour", 
    "Maida", "Suji", "Chokhar", "Fine", "Refraction"
  ];

  const statuses = ["Available", "Low Stock", "Out of Stock", "Reserved", "Damaged"];

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.inventoryItem?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || stock.inventoryItem?.category === filterCategory;
    const matchesStatus = !filterStatus || stock.movementType === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === "quantity") {
      aValue = a.quantity.value;
      bValue = b.quantity.value;
    } else if (sortBy === "totalValue") {
      aValue = a.totalValue;
      bValue = b.totalValue;
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-800";
      case "Low Stock": return "bg-yellow-100 text-yellow-800";
      case "Out of Stock": return "bg-red-100 text-red-800";
      case "Reserved": return "bg-blue-100 text-blue-800";
      case "Damaged": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setEditForm({
      reason: stock.reason || "",
      referenceNumber: stock.referenceNumber || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      console.log("Updating stock:", selectedStock._id, editForm);
      const response = await api.put(API_ENDPOINTS.STOCK.UPDATE(selectedStock._id), editForm);
      console.log("Update response:", response.data);
      
      if (response.data && response.data.success) {
        alert("Stock movement updated successfully!");
        setShowEditModal(false);
        onStockUpdate && onStockUpdate();
        
        // Trigger events for real-time updates
        window.dispatchEvent(new CustomEvent('stockUpdated'));
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
      } else {
        alert(`Failed to update stock movement: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating stock movement:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      alert(`Error updating stock movement: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (stockId) => {
    if (window.confirm("Are you sure you want to delete this stock movement? This action cannot be undone.")) {
      try {
        const response = await api.delete(API_ENDPOINTS.STOCK.DELETE(stockId));
        if (response.data && response.data.success) {
          alert("Stock movement deleted successfully!");
          onStockUpdate && onStockUpdate();
          
          // Trigger events for real-time updates
          window.dispatchEvent(new CustomEvent('stockUpdated'));
          window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        } else {
          alert(`Failed to delete stock movement: ${response.data?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Error deleting stock movement:", error);
        const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
        alert(`Error deleting stock movement: ${errorMessage}`);
      }
    }
  };

  const handleView = (stock) => {
    setSelectedStock(stock);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Stock Management</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onStockUpdate && onStockUpdate()}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <FaSync className="mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="itemName-asc">Name (A-Z)</option>
            <option value="itemName-desc">Name (Z-A)</option>
            <option value="quantity-desc">Quantity (High-Low)</option>
            <option value="quantity-asc">Quantity (Low-High)</option>
            <option value="totalValue-desc">Value (High-Low)</option>
            <option value="totalValue-asc">Value (Low-High)</option>
          </select>
        </div>
      </div>

      {/* Stock List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Movement Type
              </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStocks.map((stock) => (
                <tr key={stock._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{stock.inventoryItem?.name}</div>
                      <div className="text-sm text-gray-500">{stock.inventoryItem?.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        stock.movementType === 'in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stock.movementType === 'in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {stock.quantity} {stock.inventoryItem?.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{stock.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{stock.warehouse?.name}</div>
                    <div className="text-sm text-gray-500">{stock.warehouse?.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(stock.createdAt).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500">{new Date(stock.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(stock)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(stock)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(stock._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedStocks.length === 0 && (
          <div className="text-center py-12">
            <FaBoxes className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-gray-500 text-lg mb-2">No stock movements found</div>
            <div className="text-gray-400 text-sm mb-4">
              {searchTerm || filterCategory || filterStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'No stock movements have been recorded yet.'}
            </div>
            {!searchTerm && !filterCategory && !filterStatus && (
              <div className="text-sm text-gray-600">
                <p className="mb-2">To get started:</p>
                <div className="space-y-1">
                  <p>• Go to "Add Stock" to record stock movements</p>
                  <p>• Use "Stock Transfer" to move stock between warehouses</p>
                  <p>• Stock movements will appear here automatically</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Details Modal */}
      {showModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Stock Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Name</label>
                <p className="text-sm text-gray-900">{selectedStock.inventoryItem?.name || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Code</label>
                <p className="text-sm text-gray-900">{selectedStock.inventoryItem?.code || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-900">{selectedStock.inventoryItem?.category || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Movement Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedStock.movementType === 'in' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedStock.movementType === 'in' ? 'Stock In' : 'Stock Out'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <p className="text-sm text-gray-900">{selectedStock.quantity} {selectedStock.inventoryItem?.unit || ""}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <p className="text-sm text-gray-900">{selectedStock.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                <p className="text-sm text-gray-900">{selectedStock.referenceNumber || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                <p className="text-sm text-gray-900">{selectedStock.warehouse?.name || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="text-sm text-gray-900">{selectedStock.createdBy?.name || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="text-sm text-gray-900">{new Date(selectedStock.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEdit(selectedStock);
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Stock Movement</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedStock.inventoryItem?.name} ({selectedStock.inventoryItem?.code})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Movement Type
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedStock.movementType === 'in' ? 'Stock In' : 'Stock Out'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedStock.quantity} {selectedStock.inventoryItem?.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for this movement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={editForm.referenceNumber}
                  onChange={(e) => setEditForm({...editForm, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Invoice, PO, etc."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    isUpdating 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isUpdating ? (
                    <>
                      <FaSync className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Movement'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
