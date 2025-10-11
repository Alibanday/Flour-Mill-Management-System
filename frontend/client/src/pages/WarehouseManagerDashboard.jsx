import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWarehouse, FaBoxes, FaExclamationTriangle, FaChartLine, FaPlus,
  FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaDownload, FaRefresh,
  FaBuilding, FaClipboardList, FaHistory, FaUser, FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import DamageReportModal from '../components/DamageReportModal';

export default function WarehouseManagerDashboard() {
  const navigate = useNavigate();
  const { user, role, isWarehouseManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Mock data - replace with actual API calls
  const [warehouseData, setWarehouseData] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [showDamageReportModal, setShowDamageReportModal] = useState(false);

  // Check if user is warehouse manager
  useEffect(() => {
    if (!isWarehouseManager()) {
      navigate('/dashboard');
      toast.error('Access denied. This dashboard is for Warehouse Managers only.');
      return;
    }
    
    fetchWarehouseData();
    fetchStockData();
    fetchDamageReports();
  }, [navigate, isWarehouseManager]);

  const fetchWarehouseData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockWarehouse = {
        _id: '1',
        warehouseNumber: 'WH123456',
        name: 'Main Warehouse',
        location: 'Industrial Area, Karachi',
        capacity: {
          totalCapacity: 1000,
          currentUsage: 750,
          unit: '50kg bags'
        },
        status: 'Active',
        manager: user._id
      };
      setWarehouseData(mockWarehouse);
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      toast.error('Failed to fetch warehouse data');
    }
  };

  const fetchStockData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockStock = [
        {
          _id: '1',
          name: 'Wheat Flour',
          code: 'WF001',
          category: 'Finished Products',
          currentStock: 150,
          minimumStock: 50,
          unit: '50kg bags',
          status: 'Active',
          location: 'Aisle: A, Shelf: 1, Bin: 2'
        },
        {
          _id: '2',
          name: 'Maida',
          code: 'MD002',
          category: 'Finished Products',
          currentStock: 25,
          minimumStock: 30,
          unit: '50kg bags',
          status: 'Low Stock',
          location: 'Aisle: B, Shelf: 2, Bin: 1'
        },
        {
          _id: '3',
          name: 'Wheat Grain',
          code: 'WG003',
          category: 'Raw Materials',
          currentStock: 0,
          minimumStock: 100,
          unit: 'tons',
          status: 'Out of Stock',
          location: 'Aisle: C, Shelf: 1, Bin: 3'
        }
      ];
      setStockData(mockStock);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
    }
  };

  const fetchDamageReports = async () => {
    try {
      // Mock data - replace with actual API call
      const mockReports = [
        {
          _id: '1',
          inventoryItem: 'Wheat Flour',
          quantityDamaged: 5,
          reason: 'Water Damage',
          severity: 'Medium',
          status: 'Reported',
          estimatedLoss: 2500,
          currency: 'PKR',
          damageDate: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15')
        },
        {
          _id: '2',
          inventoryItem: 'Maida',
          quantityDamaged: 2,
          reason: 'Pest Damage',
          severity: 'High',
          status: 'Under Review',
          estimatedLoss: 1200,
          currency: 'PKR',
          damageDate: new Date('2024-01-14'),
          createdAt: new Date('2024-01-14')
        }
      ];
      setDamageReports(mockReports);
    } catch (error) {
      console.error('Error fetching damage reports:', error);
      toast.error('Failed to fetch damage reports');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleDamageReportSubmitted = (newReport) => {
    // Add the new report to the existing reports
    setDamageReports(prev => [newReport, ...prev]);
    toast.success('Damage report submitted successfully');
  };

  const filteredStock = stockData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status.toLowerCase().replace(' ', '') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredDamageReports = damageReports.filter(report => {
    const matchesSearch = report.inventoryItem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status.toLowerCase().replace(' ', '') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase().replace(' ', '')) {
      case 'active':
      case 'instock':
        return 'bg-green-100 text-green-800';
      case 'lowstock':
        return 'bg-yellow-100 text-yellow-800';
      case 'outofstock':
        return 'bg-red-100 text-red-800';
      case 'reported':
        return 'bg-blue-100 text-blue-800';
      case 'underreview':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                  {warehouseData?.name} ({warehouseData?.warehouseNumber})
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
              { id: 'overview', label: 'Overview', icon: FaChartLine },
              { id: 'stock', label: 'Stock Management', icon: FaBoxes },
              { id: 'damage', label: 'Damage Reports', icon: FaExclamationTriangle },
              { id: 'history', label: 'History', icon: FaHistory }
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Warehouse Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaBuilding className="mr-2 text-blue-600" />
                  Warehouse Information
                </h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  warehouseData?.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {warehouseData?.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{warehouseData?.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capacity Usage</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(warehouseData?.capacity?.currentUsage / warehouseData?.capacity?.totalCapacity) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {warehouseData?.capacity?.currentUsage} / {warehouseData?.capacity?.totalCapacity} {warehouseData?.capacity?.unit}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Capacity</p>
                  <p className="font-medium">
                    {warehouseData?.capacity?.totalCapacity - warehouseData?.capacity?.currentUsage} {warehouseData?.capacity?.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaBoxes className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{stockData.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stockData.filter(item => item.status === 'Low Stock').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaExclamationTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stockData.filter(item => item.status === 'Out of Stock').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FaClipboardList className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Damage Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{damageReports.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Management Tab */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
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
                <button
                  onClick={fetchStockData}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRefresh className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stock Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStock.map((item) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Damage Reports Tab */}
        {activeTab === 'damage' && (
          <div className="space-y-6">
            {/* Header with Report Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Damage Reports</h2>
              <button
                onClick={() => setShowDamageReportModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaPlus className="mr-2" />
                Report Damage
              </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
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
            </div>

            {/* Damage Reports Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Damaged
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estimated Loss
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDamageReports.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.inventoryItem}
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
                          {report.estimatedLoss} {report.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.damageDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h2>
            <p className="text-gray-600">Activity history will be displayed here.</p>
          </div>
        )}
      </div>

      {/* Damage Report Modal */}
      <DamageReportModal
        isOpen={showDamageReportModal}
        onClose={() => setShowDamageReportModal(false)}
        warehouseId={warehouseData?._id}
        onReportSubmitted={handleDamageReportSubmitted}
      />
    </div>
  );
}
