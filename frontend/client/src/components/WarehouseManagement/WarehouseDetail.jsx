import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaWarehouse, FaArrowLeft, FaBoxes, FaSeedling, 
  FaIndustry, FaShapes, FaCheckCircle, FaCircle 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [warehouse, setWarehouse] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bags');

  useEffect(() => {
    fetchWarehouseDetails();
  }, [id]);

  const fetchWarehouseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_INVENTORY(id));
      
      if (response.data && response.data.success) {
        setWarehouse(response.data.data.warehouse);
        setInventory(response.data.data.inventory);
      } else {
        toast.error('Failed to load warehouse details');
        navigate('/warehouses');
      }
    } catch (error) {
      console.error('Error fetching warehouse details:', error);
      toast.error('Failed to load warehouse details');
      navigate('/warehouses');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return `Rs. ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Warehouse not found</p>
        <button
          onClick={() => navigate('/warehouses')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Warehouses
        </button>
      </div>
    );
  }

  const bagsInventory = inventory?.bags || {};
  const wheatInventory = inventory?.wheat || {};
  const productionInventory = inventory?.production || {};
  const actualStock = inventory?.actualStock || [];
  const actualStockTotals = inventory?.actualStockTotals || {};
  const summary = inventory?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/warehouses')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
            <p className="text-gray-600">#{warehouse.warehouseNumber}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          warehouse.status === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {warehouse.status}
        </div>
      </div>

      {/* Warehouse Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="text-gray-900 font-medium">{warehouse.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Capacity</p>
            <p className="text-gray-900 font-medium">
              {warehouse.capacity?.totalCapacity || 0} {warehouse.capacity?.unit || 'units'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Usage</p>
            <p className="text-gray-900 font-medium">
              {warehouse.capacity?.currentUsage || 0} {warehouse.capacity?.unit || 'units'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-gray-900 font-medium">
              {(warehouse.capacity?.totalCapacity || 0) - (warehouse.capacity?.currentUsage || 0)} {warehouse.capacity?.unit || 'units'}
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Bags</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBags || 0}</p>
            </div>
            <FaBoxes className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Wheat Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {(wheatInventory.currentStock || wheatInventory.totalWheat || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">kg (from Inventory)</p>
            </div>
            <FaSeedling className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Production Products</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalProductionProducts || 0}</p>
            </div>
            <FaIndustry className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900">{warehouse.status}</p>
            </div>
            <FaCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>
      </div>

      {/* Inventory Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            <button
              onClick={() => setActiveTab('bags')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bags'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bags Inventory
            </button>
            <button
              onClick={() => setActiveTab('wheat')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'wheat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Wheat Inventory
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'production'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Production Products
            </button>
            <button
              onClick={() => setActiveTab('actualStock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actualStock'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actual Stock
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'bags' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bags Inventory Details</h3>
              
              {Object.entries(bagsInventory).map(([type, data]) => (
                data.totalBags > 0 && (
                  <div key={type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-gray-900 capitalize">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Bags
                      </h4>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Total: {data.totalBags}
                      </span>
                    </div>
                    {data.bags && data.bags.length > 0 && (
                      <div className="space-y-2">
                        {data.bags.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="text-sm text-gray-900">
                                {item.quantity} {item.unit}
                              </p>
                              <p className="text-xs text-gray-500">
                                From: {item.purchaseNumber} • {formatDate(item.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ))}
              {summary.totalBags === 0 && (
                <p className="text-gray-500 text-center py-8">No bags inventory found</p>
              )}
            </div>
          )}

          {activeTab === 'wheat' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wheat Inventory Details</h3>
              
              {(wheatInventory.currentStock > 0 || wheatInventory.totalWheat > 0) ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-900">Current Wheat Stock</h4>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                      {(wheatInventory.currentStock || wheatInventory.totalWheat || 0).toFixed(2)} kg
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    This is the actual current stock from the centralized inventory system, reflecting all purchases, sales, production, and transfers.
                  </p>
                  {wheatInventory.wheat && wheatInventory.wheat.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Stock Details:</div>
                      {wheatInventory.wheat.map((item, index) => (
                        <div key={index} className={`flex items-center justify-between py-2 border-b last:border-0 ${
                          item.type === 'Current Stock' ? 'bg-green-50' : ''
                        }`}>
                          <div>
                            <p className="text-sm text-gray-900">
                              {item.quantity} {item.unit}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.type === 'Current Stock' 
                                ? `Current Stock from Inventory • ${formatDate(item.date)}`
                                : `From: ${item.purchaseNumber} • ${formatDate(item.date)}`
                              }
                            </p>
                            {item.source && (
                              <p className="text-xs text-blue-600">
                                Source: {item.source} {item.quality ? `• Quality: ${item.quality}` : ''}
                              </p>
                            )}
                          </div>
                          {item.type === 'Current Stock' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Live
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No wheat inventory found</p>
              )}
            </div>
          )}

          {activeTab === 'actualStock' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Stock Levels</h3>
              
              {/* Stock Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-blue-600">{actualStockTotals.totalItems || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Quantity</p>
                    <p className="text-2xl font-bold text-indigo-600">{actualStockTotals.totalQuantity || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(actualStockTotals.totalValue || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              {actualStock && actualStock.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {actualStock.map((item, index) => (
                          <tr key={item.productId || index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <FaBoxes className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.category}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.unit}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {item.currentStock} {item.unit}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FaBoxes className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No stock available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This warehouse currently has no stock items
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'production' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Products</h3>
              
              {productionInventory.products && productionInventory.products.length > 0 ? (
                <div className="space-y-4">
                  {productionInventory.products.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-semibold text-gray-900">{product.productName}</h4>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {product.totalQuantity} {product.unit}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Weight per unit</p>
                          <p className="text-gray-900 font-medium">{product.weight} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total weight</p>
                          <p className="text-gray-900 font-medium">{product.totalWeight} kg</p>
                        </div>
                      </div>
                      {product.batchNumber && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Batch: {product.batchNumber} • {formatDate(product.productionDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No production products found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseDetail;

