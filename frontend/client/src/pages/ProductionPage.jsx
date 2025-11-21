import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import {
  FaHome, FaIndustry, FaExchangeAlt, FaClipboardList,
  FaChartLine, FaPlus, FaSearch, FaDolly, FaBoxes,
  FaEdit, FaTrash, FaEye, FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from "react-icons/fa";
import ProductionForm from "../components/ProductionManagement/ProductionForm";
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import api, { API_ENDPOINTS } from '../services/api';
import StockTransferForm from '../components/StockTransfer/StockTransferForm';
import StockTransferList from '../components/StockTransfer/StockTransferList';
import StockTransferStats from '../components/StockTransfer/StockTransferStats';
import ProductionList from '../components/ProductionManagement/ProductionList';

export default function ProductionPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Daily Production");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [productions, setProductions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const productionMenu = [
    { name: "Daily Production", icon: <FaIndustry className="mr-3" /> },
    { name: "Stock Transfer", icon: <FaExchangeAlt className="mr-3" /> },
    { name: "Production Details", icon: <FaClipboardList className="mr-3" /> },
    { name: "Raw Materials", icon: <FaBoxes className="mr-3" /> }
  ];

  const productionActions = [
    { 
      name: "New Batch", 
      icon: <FaPlus />, 
      action: () => setShowAddForm(true),
      roles: ['Admin', 'Manager'],
      color: "bg-blue-100 text-blue-600"
    },
    { 
      name: "Material Check", 
      icon: <FaSearch />, 
      action: () => console.log("Material Check"),
      roles: ['Admin', 'Manager', 'Employee'],
      color: "bg-green-100 text-green-600"
    },
    { 
      name: "Dispatch", 
      icon: <FaDolly />, 
      action: () => console.log("Dispatch"),
      roles: ['Admin', 'Manager', 'Employee'],
      color: "bg-purple-100 text-purple-600"
    }
  ];

  // API functions
  const fetchProductions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:7000/api/production', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProductions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching productions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleSubmitProduction = async (formData) => {
    try {
      const url = editData ? `http://localhost:7000/api/production/${editData._id}` : 'http://localhost:7000/api/production';
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Production saved:', data);
        
        // Reset form and refresh data
        setShowAddForm(false);
        setShowEditForm(false);
        setEditData(null);
        fetchProductions();
      } else {
        const errorData = await response.json();
        console.error('Error saving production:', errorData);
      }
    } catch (error) {
      console.error('Error submitting production:', error);
    }
  };

  const handleEdit = (production) => {
    setEditData(production);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this production record?')) {
      try {
        const response = await fetch(`http://localhost:7000/api/production/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchProductions();
        }
      } catch (error) {
        console.error('Error deleting production:', error);
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:7000/api/production/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchProductions();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

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

  // Raw materials state
  const [rawMaterials, setRawMaterials] = useState([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [rawMaterialFilters, setRawMaterialFilters] = useState({
    search: '',
    warehouse: '',
    status: ''
  });

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

  const fetchRawMaterials = async () => {
    if (activeMenu !== 'Raw Materials') return;
    try {
      setRawLoading(true);
      const params = new URLSearchParams({
        category: 'Raw Materials',
        limit: 1000
      });
      if (rawMaterialFilters.warehouse) {
        params.append('warehouse', rawMaterialFilters.warehouse);
      }
      const response = await api.get(`${API_ENDPOINTS.INVENTORY.GET_ALL}?${params.toString()}`);
      if (response.data.success) {
        setRawMaterials(mapInventoryItems(response.data.data || []));
      }
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      toast.error('Failed to load raw material data');
    } finally {
      setRawLoading(false);
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

  const handleRawFilterChange = (updates) => {
    setRawMaterialFilters(prev => ({ ...prev, ...updates }));
  };

  // Load base data
  useEffect(() => {
    fetchProductions();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (activeMenu === 'Stock Transfer') {
      fetchStockTransfers();
      fetchStockTransferStats();
      fetchInventoryItems();
    }
  }, [activeMenu, stockTransferFilters, stockTransferPagination.page]);

  useEffect(() => {
    if (activeMenu === 'Raw Materials') {
      fetchRawMaterials();
    }
  }, [activeMenu, rawMaterialFilters.warehouse]);

  useEffect(() => {
    if (activeMenu !== 'Daily Production') {
      setShowAddForm(false);
      setShowEditForm(false);
      setEditData(null);
    }
  }, [activeMenu]);

  // Filter productions based on search term
  const filteredProductions = productions.filter(production =>
    production.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const filteredRawMaterials = useMemo(() => {
    return rawMaterials.filter(item => {
      const matchesSearch = rawMaterialFilters.search
        ? item.name.toLowerCase().includes(rawMaterialFilters.search.toLowerCase())
        : true;
      const matchesWarehouse = rawMaterialFilters.warehouse
        ? item.warehouse === rawMaterialFilters.warehouse
        : true;
      const matchesStatus = rawMaterialFilters.status
        ? (item.status || '').toLowerCase() === rawMaterialFilters.status.toLowerCase()
        : true;
      return matchesSearch && matchesWarehouse && matchesStatus;
    });
  }, [rawMaterials, rawMaterialFilters]);

  const rawMaterialSummary = useMemo(() => {
    const totalItems = filteredRawMaterials.length;
    const totalQuantity = filteredRawMaterials.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStock = filteredRawMaterials.filter(item =>
      item.status === 'Low Stock' ||
      (item.minimumStock > 0 && item.quantity <= item.minimumStock && item.quantity > 0)
    ).length;
    const outOfStock = filteredRawMaterials.filter(item => item.quantity === 0).length;

    return { totalItems, totalQuantity, lowStock, outOfStock };
  }, [filteredRawMaterials]);

  const renderDailyProduction = () => (
    <>
      {showAddForm && (
        <ProductionForm
          onSubmit={handleSubmitProduction}
          onCancel={() => setShowAddForm(false)}
          warehouses={warehouses}
        />
      )}

      {showEditForm && editData && (
        <ProductionForm
          onSubmit={handleSubmitProduction}
          onCancel={() => {
            setShowEditForm(false);
            setEditData(null);
          }}
          editData={editData}
          warehouses={warehouses}
        />
      )}

      {!showAddForm && !showEditForm && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
            {productionActions.map((button, index) => {
              const hasPermission = button.roles.some(role => 
                (role === 'Admin' && isAdmin()) ||
                (role === 'Manager' && isManager()) ||
                (role === 'Employee' && isEmployee())
              );

              if (!hasPermission) return null;

              return (
                <button
                  key={index}
                  onClick={button.action}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group border border-gray-100 ${button.color} hover:bg-opacity-80`}
                >
                  <div className="p-3 mb-2 rounded-full bg-white bg-opacity-50 group-hover:bg-opacity-100">
                    {button.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{button.name}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Production Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search production..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <FaIndustry className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Batches</p>
                    <p className="text-2xl font-bold text-blue-900">{filteredProductions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <FaCheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Completed</p>
                    <p className="text-2xl font-bold text-green-900">
                      {filteredProductions.filter(p => p.status === 'Completed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <FaExclamationTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {filteredProductions.filter(p => p.status === 'In Progress').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <FaTimesCircle className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Quality Check</p>
                    <p className="text-2xl font-bold text-red-900">
                      {filteredProductions.filter(p => p.status === 'Quality Check').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredProductions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No production records found
                      </td>
                    </tr>
                  ) : (
                    filteredProductions.map((production) => (
                      <tr key={production._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {production.batchNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{production.productName}</div>
                          <div className="text-sm text-gray-500">{production.productType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {production.quantity?.value || 0} {production.quantity?.unit || 'kg'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Rs. {production.productionCost?.totalCost?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            production.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            production.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            production.status === 'Quality Check' ? 'bg-blue-100 text-blue-800' :
                            production.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {production.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {production.productionDate ? new Date(production.productionDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(production)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            {(isAdmin() || isManager()) && (
                              <button
                                onClick={() => handleDelete(production._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusUpdate(production._id, 'Completed')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark Complete"
                            >
                              <FaCheckCircle />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );

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

  const renderProductionDetailsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Production Details</h2>
          <p className="text-gray-600">Detailed view of all production batches</p>
        </div>
      </div>
      <ProductionList
        productions={productions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
      />
    </div>
  );

  const renderRawMaterialsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Raw Material Availability</h2>
          <p className="text-gray-600">Monitor raw material stock across warehouses</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={rawMaterialFilters.search}
              onChange={(e) => handleRawFilterChange({ search: e.target.value })}
              placeholder="Search materials..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select
              value={rawMaterialFilters.warehouse}
              onChange={(e) => handleRawFilterChange({ warehouse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={rawMaterialFilters.status}
              onChange={(e) => handleRawFilterChange({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setRawMaterialFilters({ search: '', warehouse: '', status: '' })}
              className="w-full px-3 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">Total Items</p>
          <p className="text-3xl font-bold text-blue-900">{rawMaterialSummary.totalItems}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">Total Quantity</p>
          <p className="text-3xl font-bold text-green-900">{rawMaterialSummary.totalQuantity.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">Low Stock</p>
          <p className="text-3xl font-bold text-yellow-900">{rawMaterialSummary.lowStock}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">Out of Stock</p>
          <p className="text-3xl font-bold text-red-900">{rawMaterialSummary.outOfStock}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {rawLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRawMaterials.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No raw material records found
                  </td>
                </tr>
              ) : (
                filteredRawMaterials.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.warehouseName || warehouses.find(w => w._id === item.warehouse)?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity.toFixed(2)} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.minimumStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'Out of Stock'
                          ? 'bg-red-100 text-red-800'
                          : item.status === 'Low Stock'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (activeMenu) {
      case 'Stock Transfer':
        return renderStockTransferSection();
      case 'Production Details':
        return renderProductionDetailsSection();
      case 'Raw Materials':
        return renderRawMaterialsSection();
      default:
        return renderDailyProduction();
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
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaIndustry className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">PRODUCTION MENU</h3>
            <ul className="space-y-1">
              {productionMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveMenu(item.name)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeMenu === item.name
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'bg-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-600'
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
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
