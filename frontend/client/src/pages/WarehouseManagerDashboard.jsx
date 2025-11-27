import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWarehouse, FaBoxes,
  FaSearch, FaRedo, FaUser, FaSignOutAlt,
  FaIdCard, FaTruck, FaEye, FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import api, { API_ENDPOINTS } from '../services/api';

export default function WarehouseManagerDashboard() {
  const navigate = useNavigate();
  const { user, isWarehouseManager, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [gatePassSearchTerm, setGatePassSearchTerm] = useState('');
  const [stockFilterStatus, setStockFilterStatus] = useState('all');
  const [gatePassFilterStatus, setGatePassFilterStatus] = useState('all');
  
  const [warehouseData, setWarehouseData] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [dispatchingGatePassId, setDispatchingGatePassId] = useState(null);

  // Use ref to track if data has been initialized to prevent infinite loops
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);
  const warehouseIdRef = useRef(null);

  // Fetch warehouse data function
  const fetchWarehouseData = useCallback(async () => {
    try {
      // Verify token exists before making request
      const token = localStorage.getItem('token');
      console.log('🔑 Token check before API call:', token ? 'Token exists (' + token.substring(0, 20) + '...)' : 'NO TOKEN FOUND');
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        return null;
      }

      // First try: Get warehouse from warehouse-manager endpoint (warehouse.manager = user._id)
      try {
        console.log('📡 Making API call to warehouse-manager/warehouse endpoint');
        const response = await api.get('http://localhost:7000/api/warehouse-manager/warehouse');
        if (response.data && !response.data.message) {
          console.log('✅ Warehouse found via manager endpoint');
          const warehouse = response.data;
          setWarehouseData(warehouse);
          warehouseIdRef.current = warehouse._id;
          return warehouse;
        }
      } catch (err) {
        console.error('❌ Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.response?.data?.message || err.message,
          headers: err.config?.headers
        });
        
        // If 401, don't try alternative - authentication issue
        if (err.response?.status === 401) {
          console.error('🔒 401 Unauthorized - Check backend logs for details');
          console.error('Response data:', err.response?.data);
          throw err; // Re-throw to prevent fallback
        }
        // If 404, try alternative method
        if (err.response?.status === 404) {
          console.log('Warehouse not found via manager endpoint (404), trying user.warehouse field');
        } else {
          console.error('Error fetching warehouse from manager endpoint:', err.response?.data?.message || err.message);
        }
      }
      
      // Second try: Get warehouse from user.warehouse field
      const currentUser = user;
      if (currentUser?.warehouse) {
        try {
          const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_BY_ID(currentUser.warehouse));
          if (response.data.success || response.data) {
            const warehouse = response.data.data || response.data;
            setWarehouseData(warehouse);
            warehouseIdRef.current = warehouse._id || currentUser.warehouse;
            return warehouse;
          }
        } catch (err) {
          // If 401, re-throw to prevent fallback
          if (err.response?.status === 401) {
            console.error('Authentication error fetching warehouse from user field:', err.response?.data?.message || err.message);
            throw err;
          }
          console.error('Error fetching warehouse from user field:', err.response?.data?.message || err.message);
        }
      }
      
      // No warehouse found
      return null;
    } catch (error) {
      console.error('Error fetching warehouse data:', error.response?.data?.message || error.message);
      // Don't throw here - let the component handle it gracefully
      return null;
    }
  }, [user]);

  // Fetch stock data function
  const fetchStockData = useCallback(async (warehouseId = null) => {
    try {
      // Check if token exists before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for API call');
        toast.error('No authentication token found');
        return;
      }

      const id = warehouseId || warehouseIdRef.current || user?.warehouse;
      console.log('🔍 Fetching stock data for warehouse ID:', id);
      
      if (!id) {
        console.error('No warehouse ID available for fetching stock');
        toast.error('No warehouse ID found. Please ensure a warehouse is assigned.');
        return;
      }
      
      // Try warehouse-manager/stock endpoint first
      try {
        console.log('📡 Attempting to fetch stock from /api/warehouse-manager/stock');
        const response = await api.get('http://localhost:7000/api/warehouse-manager/stock');
        console.log('📦 Stock API response:', response.data);
        
        // Check if response is an array or has a message property (error)
        if (response.data && Array.isArray(response.data)) {
          const inventoryItems = response.data;
          console.log(`✅ Found ${inventoryItems.length} stock items from warehouse-manager endpoint`);
          
          if (inventoryItems.length === 0) {
            console.warn('⚠️ No stock items found in warehouse');
            toast.info('No stock items found in your warehouse');
            setStockData([]);
            return;
          }
          
          const stockItems = inventoryItems.map(item => {
            // Handle location field - can be string or object
            let locationStr = 'N/A';
            if (typeof item.location === 'string') {
              locationStr = item.location;
            } else if (item.location && typeof item.location === 'object') {
              if (item.location.aisle) {
                const parts = [item.location.aisle, item.location.shelf, item.location.bin].filter(Boolean);
                locationStr = parts.join('-') || 'N/A';
              }
            }
            
            return {
              _id: item._id,
              name: item.name || 'Unnamed Item',
              code: item.code || 'N/A',
              category: item.category || 'Uncategorized',
              currentStock: item.currentStock || 0,
              minimumStock: item.minimumStock || 0,
              unit: item.unit || 'units',
              status: item.currentStock === 0 ? 'Out of Stock' : 
                     item.currentStock <= item.minimumStock ? 'Low Stock' : 'Active',
              location: locationStr
            };
          });
          
          console.log('📊 Processed stock items:', stockItems.length);
          setStockData(stockItems);
          if (stockItems.length > 0) {
            console.log('✅ Stock data loaded successfully');
          }
          return;
        } else if (response.data?.message) {
          // Error message from API
          console.error('❌ API returned error message:', response.data.message);
          throw new Error(response.data.message);
        }
      } catch (err) {
        console.error('❌ Error from warehouse-manager/stock endpoint:', err.response?.data || err.message);
        
        // If it's a 404, try fallback. Otherwise, show error
        if (err.response?.status === 404) {
          console.log('⚠️ Warehouse-manager endpoint returned 404, trying inventory endpoint fallback');
        } else if (err.response?.status !== 401) {
          // Don't show error for 401 (auth issues handled elsewhere)
          toast.error(`Failed to fetch stock: ${err.response?.data?.message || err.message}`);
        }
      }
      
      // Fallback to inventory endpoint with warehouse filter
      try {
        console.log(`📡 Fallback: Fetching stock from inventory endpoint with warehouse=${id}`);
        const response = await api.get(`${API_ENDPOINTS.INVENTORY.GET_ALL}?warehouse=${id}&limit=1000`);
        console.log('📦 Inventory API response:', response.data);
        
        let inventoryItems = [];
        if (response.data?.success && response.data?.data) {
          inventoryItems = response.data.data;
        } else if (Array.isArray(response.data)) {
          inventoryItems = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          inventoryItems = response.data.data;
        }
        
        console.log(`✅ Found ${inventoryItems.length} inventory items from inventory endpoint`);
        
        if (inventoryItems.length === 0) {
          console.warn('⚠️ No inventory items found for this warehouse');
          toast.info('No inventory items found in your warehouse');
          setStockData([]);
          return;
        }
        
        const stockItems = inventoryItems.map(item => {
          // Handle location field - can be string or object
          let locationStr = 'N/A';
          if (typeof item.location === 'string') {
            locationStr = item.location;
          } else if (item.location && typeof item.location === 'object') {
            if (item.location.aisle) {
              const parts = [item.location.aisle, item.location.shelf, item.location.bin].filter(Boolean);
              locationStr = parts.join('-') || 'N/A';
            }
          }
          
          return {
            _id: item._id,
            name: item.name || 'Unnamed Item',
            code: item.code || 'N/A',
            category: item.category || 'Uncategorized',
            currentStock: item.currentStock || 0,
            minimumStock: item.minimumStock || 0,
            unit: item.unit || 'units',
            status: item.currentStock === 0 ? 'Out of Stock' : 
                   item.currentStock <= item.minimumStock ? 'Low Stock' : 'Active',
            location: locationStr
          };
        });
        
        console.log('📊 Processed inventory items:', stockItems.length);
        setStockData(stockItems);
        if (stockItems.length > 0) {
          console.log(`✅ Successfully loaded ${stockItems.length} stock item(s) from inventory endpoint`);
        }
      } catch (fallbackErr) {
        console.error('❌ Error from inventory endpoint fallback:', fallbackErr.response?.data || fallbackErr.message);
        toast.error(`Failed to fetch stock: ${fallbackErr.response?.data?.message || fallbackErr.message}`);
        setStockData([]);
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching stock data:', error);
      toast.error('An unexpected error occurred while fetching stock data');
      setStockData([]);
    }
  }, [user]);

  // Fetch gate passes function
  const fetchGatePasses = useCallback(async (warehouseId = null) => {
    try {
      // Check if token exists before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for API call');
        return;
      }

      const id = warehouseId || warehouseIdRef.current || user?.warehouse;
      if (!id) return;
      
      const response = await api.get(`${API_ENDPOINTS.GATE_PASS.GET_ALL}?warehouse=${id}`);
      const data = response.data.data || response.data || [];
      setGatePasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching gate passes:', error);
      // Don't show error toast, just log it
    }
  }, [user]);

  // Check if user is warehouse manager - only run once when auth/user changes
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Wait for user to be loaded
    if (!user) {
      console.log('No user found, redirecting to login');
      // If no user after loading completes, redirect to login
      navigate('/login');
      return;
    }

    // Check role - use user.role directly instead of calling function
    const userRole = user?.role || '';
    if (userRole !== 'Warehouse Manager') {
      navigate('/dashboard');
      toast.error('Access denied. This dashboard is for Warehouse Managers only.');
      return;
    }

    // Prevent multiple initializations
    if (hasInitialized.current || isInitializing.current) {
      return;
    }

    // Mark as initializing
    isInitializing.current = true;
    
    // Fetch warehouse data first, then fetch other data
    const initializeData = async () => {
      try {
        const warehouse = await fetchWarehouseData();
        const warehouseId = warehouse?._id || user?.warehouse;
        
        // Only fetch other data if warehouse was found
        if (warehouseId) {
          await Promise.all([
            fetchStockData(warehouseId),
            fetchGatePasses(warehouseId)
          ]);
        }
      } catch (error) {
        console.error('Error initializing data:', error.response?.data?.message || error.message);
        // Check if it's a real authentication error (401)
        if (error.response?.status === 401) {
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('No token found, redirecting to login');
            navigate('/login');
            return;
          }
          // Token exists but API returned 401 - might be invalid token or backend issue
          console.error('Token exists but API returned 401:', error.response?.data?.message || 'Unknown error');
        }
      } finally {
        setLoading(false);
        hasInitialized.current = true;
        isInitializing.current = false;
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.role, user?._id, user?.warehouse]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const filteredStock = stockData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                         item.code?.toLowerCase().includes(stockSearchTerm.toLowerCase());
    const matchesStatus = stockFilterStatus === 'all' || 
                         item.status?.toLowerCase().replace(' ', '') === stockFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredGatePasses = gatePasses.filter(gatePass => {
    const matchesSearch = gatePass.gatePassNumber?.toLowerCase().includes(gatePassSearchTerm.toLowerCase()) ||
                         gatePass.issuedTo?.name?.toLowerCase().includes(gatePassSearchTerm.toLowerCase()) ||
                         gatePass.purpose?.toLowerCase().includes(gatePassSearchTerm.toLowerCase());
    const matchesStatus = gatePassFilterStatus === 'all' || gatePass.status?.toLowerCase() === gatePassFilterStatus.toLowerCase();
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
      case 'approved':
        return 'bg-blue-100 text-blue-800';
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

  const handleViewGatePassDetails = (gatePassId) => {
    navigate(`/gate-pass/${gatePassId}`);
  };

  const handleDispatchGatePass = async (gatePassId) => {
    const notes = window.prompt('Enter dispatch notes (optional):', '');
    try {
      setDispatchingGatePassId(gatePassId);
      await api.patch(`http://localhost:7000/api/gate-pass/${gatePassId}/confirm-dispatch`, {
        notes: notes || ''
      });
      toast.success('Stock dispatch confirmed for this gate pass');
      await fetchGatePasses();
    } catch (error) {
      console.error('Error confirming dispatch:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to confirm stock dispatch');
    } finally {
      setDispatchingGatePassId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error only if loading is complete and no warehouse was found
  if (!loading && !warehouseData && !user?.warehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <FaWarehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Warehouse Assigned</h2>
          <p className="text-gray-600 mb-4">Please contact your administrator to assign a warehouse to your account.</p>
          <button
            onClick={async () => {
              setLoading(true);
              const warehouse = await fetchWarehouseData();
              const warehouseId = warehouse?._id || user?.warehouse;
              if (warehouseId) {
                await Promise.all([
                  fetchStockData(warehouseId),
                  fetchGatePasses(warehouseId)
                ]);
              }
              setLoading(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stock Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FaBoxes className="mr-2 text-blue-600" />
                Stock of Your Warehouse
              </h2>
              <button
                onClick={() => fetchStockData()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaRedo className="mr-2" />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search stock items..."
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={stockFilterStatus}
                  onChange={(e) => setStockFilterStatus(e.target.value)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No stock items found
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.category && (
                            <div className="text-sm text-gray-500">{item.category}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.code}
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

        {/* Gate Passes Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FaIdCard className="mr-2 text-purple-600" />
                Gate Passes
              </h2>
              <button
                onClick={() => fetchGatePasses()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaRedo className="mr-2" />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search gate passes..."
                    value={gatePassSearchTerm}
                    onChange={(e) => setGatePassSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={gatePassFilterStatus}
                  onChange={(e) => setGatePassFilterStatus(e.target.value)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleViewGatePassDetails(gatePass._id)}
                              className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              View Details
                            </button>
                            {gatePass.status === 'Active' && !gatePass.stockDispatch?.confirmed && (
                              <button
                                onClick={() => handleDispatchGatePass(gatePass._id)}
                                className="px-3 py-1 text-xs font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                                disabled={dispatchingGatePassId === gatePass._id}
                              >
                                {dispatchingGatePassId === gatePass._id ? 'Dispatching...' : 'Dispatch Stock'}
                              </button>
                            )}
                            {gatePass.stockDispatch?.confirmed && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                <FaCheckCircle className="mr-1" />
                                Dispatched
                              </span>
                            )}
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
      </div>
    </div>
  );
}
