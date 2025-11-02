import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWarehouse, FaBoxes, FaExclamationTriangle, FaPlus,
  FaSearch, FaRedo, FaClipboardList, FaUser, FaSignOutAlt,
  FaIdCard, FaCalendarAlt, FaTruck, FaEye
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import DamageReportModal from '../components/DamageReportModal';
import api, { API_ENDPOINTS } from '../services/api';

export default function WarehouseManagerDashboard() {
  const navigate = useNavigate();
  const { user, role, isWarehouseManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [warehouseData, setWarehouseData] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [showDamageReportModal, setShowDamageReportModal] = useState(false);

  // Check if user is warehouse manager
  useEffect(() => {
    if (!isWarehouseManager()) {
      navigate('/dashboard');
      toast.error('Access denied. This dashboard is for Warehouse Managers only.');
      return;
    }
    
    // Fetch data only if user has warehouse assigned
    if (user?.warehouse) {
      fetchWarehouseData();
      fetchStockData();
      fetchGatePasses();
      fetchDamageReports();
      setLoading(false);
    } else {
      toast.error('No warehouse assigned to your account. Please contact administrator.');
      setLoading(false);
    }
  }, [navigate, isWarehouseManager, user]);

  const fetchWarehouseData = async () => {
    try {
      if (!user?.warehouse) return;
      
      // Try warehouse-manager endpoint first, fallback to direct warehouse endpoint
      try {
        const response = await api.get('http://localhost:7000/api/warehouse-manager/warehouse');
        if (response.data) {
          setWarehouseData(response.data);
          return;
        }
      } catch (err) {
        // Fallback to direct warehouse endpoint
      }
      
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_BY_ID(user.warehouse));
      if (response.data.success || response.data) {
        setWarehouseData(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      toast.error('Failed to fetch warehouse data');
    }
  };

  const fetchStockData = async () => {
    try {
      if (!user?.warehouse) return;
      
      // Try warehouse-manager endpoint first, fallback to inventory endpoint
      try {
        const response = await api.get('http://localhost:7000/api/warehouse-manager/stock');
        const inventoryItems = response.data || [];
        
        const stockItems = inventoryItems.map(item => ({
          _id: item._id,
          name: item.name,
          code: item.code,
          category: item.category,
          currentStock: item.currentStock || 0,
          minimumStock: item.minimumStock || 0,
          unit: item.unit || 'units',
          status: item.currentStock === 0 ? 'Out of Stock' : 
                 item.currentStock <= item.minimumStock ? 'Low Stock' : 'Active',
          location: item.location || 'N/A'
        }));
        
        setStockData(stockItems);
        return;
      } catch (err) {
        // Fallback to inventory endpoint
      }
      
      // Fallback: Fetch inventory items for this warehouse
      const response = await api.get(`${API_ENDPOINTS.INVENTORY.GET_ALL}?warehouse=${user.warehouse}`);
      const inventoryItems = response.data.data || response.data || [];
      
      const stockItems = inventoryItems.map(item => ({
        _id: item._id,
        name: item.name,
        code: item.code,
        category: item.category,
        currentStock: item.currentStock || 0,
        minimumStock: item.minimumStock || 0,
        unit: item.unit || 'units',
        status: item.currentStock === 0 ? 'Out of Stock' : 
               item.currentStock <= item.minimumStock ? 'Low Stock' : 'Active',
        location: item.location || 'N/A'
      }));
      
      setStockData(stockItems);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
    }
  };

  const fetchGatePasses = async () => {
    try {
      if (!user?.warehouse) return;
      
      const response = await api.get(`${API_ENDPOINTS.GATE_PASS.GET_ALL}?warehouse=${user.warehouse}`);
      const data = response.data.data || response.data || [];
      setGatePasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching gate passes:', error);
      toast.error('Failed to fetch gate passes');
    }
  };

  const fetchDamageReports = async () => {
    try {
      if (!user?.warehouse) return;
      
      // Try warehouse-manager endpoint first, fallback to direct query
      try {
        const response = await api.get('http://localhost:7000/api/warehouse-manager/damage-reports');
        const data = response.data.data || response.data || [];
        setDamageReports(Array.isArray(data) ? data : []);
        return;
      } catch (err) {
        // If warehouse-manager endpoint fails, try direct query by warehouse
        if (err.response?.status === 404) {
          const response = await api.get(`http://localhost:7000/api/damage-reports?warehouse=${user.warehouse}`);
          const data = response.data.data || response.data || [];
          setDamageReports(Array.isArray(data) ? data : []);
          return;
        }
        throw err;
      }
    } catch (error) {
      console.error('Error fetching damage reports:', error);
      // Don't show error if endpoint doesn't exist yet
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch damage reports');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleDamageReportSubmitted = (newReport) => {
    setDamageReports(prev => [newReport, ...prev]);
    toast.success('Damage report submitted successfully');
    fetchDamageReports(); // Refresh the list
  };

  const filteredStock = stockData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         item.status?.toLowerCase().replace(' ', '') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredGatePasses = gatePasses.filter(gatePass => {
    const matchesSearch = gatePass.gatePassNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gatePass.issuedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gatePass.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || gatePass.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const filteredDamageReports = damageReports.filter(report => {
    const itemName = typeof report.inventoryItem === 'object' 
      ? report.inventoryItem?.name 
      : report.inventoryItem;
    const matchesSearch = itemName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         report.status?.toLowerCase().replace(' ', '') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase().replace(' ', '') || '';
    switch (statusLower) {
      case 'active':
      case 'instock':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'lowstock':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'outofstock':
      case 'expired':
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'reported':
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'underreview':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGatePassTypeIcon = (type) => {
    switch (type) {
      case 'Person': return <FaUser className="h-4 w-4" />;
      case 'Vehicle': return <FaTruck className="h-4 w-4" />;
      case 'Material': return <FaBoxes className="h-4 w-4" />;
      default: return <FaIdCard className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.warehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaWarehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Warehouse Assigned</h2>
          <p className="text-gray-600">Please contact your administrator to assign a warehouse to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FaWarehouse className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Warehouse Manager Dashboard</h1>
                <p className="text-sm text-gray-600">
                  {warehouseData?.name || 'Warehouse'} ({warehouseData?.warehouseNumber || 'N/A'})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <FaUser className="mr-2" />
                {user?.firstName} {user?.lastName}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'stock', label: 'Stock', icon: FaBoxes },
              { id: 'gatepasses', label: 'Gate Passes', icon: FaIdCard },
              { id: 'damage', label: 'Damage Reports', icon: FaExclamationTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaBoxes className="mr-2 text-blue-600" />
                  Stock Management
                </h2>
                <button
                  onClick={fetchStockData}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRedo className="mr-2" />
                  Refresh
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stock items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="lowstock">Low Stock</option>
                    <option value="outofstock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Stock Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No stock items found
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.code}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.currentStock}</div>
                            <div className="text-sm text-gray-500">{item.unit}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.location}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Gate Passes Tab */}
        {activeTab === 'gatepasses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaIdCard className="mr-2 text-blue-600" />
                  Gate Passes
                </h2>
                <button
                  onClick={fetchGatePasses}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRedo className="mr-2" />
                  Refresh
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search gate passes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Gate Passes Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Pass #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGatePasses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No gate passes found
                        </td>
                      </tr>
                    ) : (
                      filteredGatePasses.map((gatePass) => (
                        <tr key={gatePass._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{gatePass.gatePassNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getGatePassTypeIcon(gatePass.type)}
                              <span className="ml-2 text-sm text-gray-900">{gatePass.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {gatePass.issuedTo?.name || 'N/A'}
                            </div>
                            {gatePass.issuedTo?.contact && (
                              <div className="text-sm text-gray-500">{gatePass.issuedTo.contact}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={gatePass.purpose}>
                              {gatePass.purpose}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(gatePass.status)}`}>
                              {gatePass.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {gatePass.validUntil ? new Date(gatePass.validUntil).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Damage Reports Tab */}
        {activeTab === 'damage' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaExclamationTriangle className="mr-2 text-red-600" />
                  Damage Reports
                </h2>
                <button
                  onClick={() => setShowDamageReportModal(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FaPlus className="mr-2" />
                  Report Damage
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search damage reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="reported">Reported</option>
                    <option value="underreview">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Damage Reports Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Damaged</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Loss</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDamageReports.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No damage reports found
                        </td>
                      </tr>
                    ) : (
                      filteredDamageReports.map((report) => {
                        const itemName = typeof report.inventoryItem === 'object' 
                          ? report.inventoryItem?.name 
                          : report.inventoryItem || 'N/A';
                        return (
                          <tr key={report._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {itemName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {report.quantityDamaged}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.reason}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                                {report.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {report.estimatedLoss ? `${report.estimatedLoss} ${report.currency || 'PKR'}` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.damageDate ? new Date(report.damageDate).toLocaleDateString() : 
                               report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Damage Report Modal */}
      <DamageReportModal
        isOpen={showDamageReportModal}
        onClose={() => setShowDamageReportModal(false)}
        warehouseId={user?.warehouse}
        onReportSubmitted={handleDamageReportSubmitted}
      />
    </div>
  );
}