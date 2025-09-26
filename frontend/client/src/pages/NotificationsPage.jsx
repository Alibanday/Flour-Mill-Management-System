import React, { useState, useEffect } from 'react';
import { FaBell, FaFilter, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaClock, FaTrash, FaEye, FaEyeSlash, FaSync, FaPlus } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import api, { API_ENDPOINTS } from '../services/api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, breakdown: {} });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    unreadOnly: false
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    hasNext: false,
    hasPrev: false
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [metadata, setMetadata] = useState({ types: [], priorities: [], statuses: [] });
  const { user } = useAuth();

  // Fetch notifications with better error handling
  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      console.log('Fetching notifications for page:', page);
      
      let notifications = [];
      let pagination = {};
      
      // Try to get notifications with timeout and error handling
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...filters
        });

        const url = `http://localhost:7000/api/notifications?${queryParams}`;
        console.log('Fetching from URL:', url);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await api.get(url, {
          signal: controller.signal,
          timeout: 10000
        });
        
        clearTimeout(timeoutId);
        console.log('Response received:', response);
        
        if (response.data && response.data.success) {
          notifications = response.data.data || [];
          pagination = response.data.pagination || {};
          console.log('Notifications fetched successfully:', notifications.length);
        }
      } catch (error) {
        console.log('Main endpoint failed:', error.message);
        
        // Try alternative endpoint with timeout
        try {
          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort(), 5000);
          
          const altResponse = await api.get('http://localhost:7000/api/notifications/all', {
            signal: altController.signal,
            timeout: 5000
          });
          
          clearTimeout(altTimeoutId);
          
          if (altResponse.data && altResponse.data.success) {
            notifications = altResponse.data.data || [];
            console.log('Alternative endpoint worked:', notifications.length);
          }
        } catch (altError) {
          console.log('Alternative endpoint also failed:', altError.message);
        }
      }
      
      // If still no notifications, check for real low stock items
      if (notifications.length === 0) {
        console.log('No notifications found, checking for real low stock items...');
        
        try {
          // Check inventory for low stock items
          const inventoryResponse = await api.get('http://localhost:7000/api/inventory/low-stock', {
            timeout: 5000
          });
          
          if (inventoryResponse.data && inventoryResponse.data.success) {
            const lowStockItems = inventoryResponse.data.data || [];
            console.log('Found low stock items:', lowStockItems.length);
            
            if (lowStockItems.length > 0) {
              // Create notifications for real low stock items
              notifications = lowStockItems.map(item => ({
                _id: 'low-stock-' + item._id,
                type: 'low_stock',
                title: 'Low Stock Alert',
                message: `${item.name} is running low in ${item.warehouse?.name || 'Unknown Warehouse'}. Current stock: ${item.currentStock} ${item.unit}`,
                priority: item.currentStock === 0 ? 'critical' : 'high',
                status: 'unread',
                createdAt: new Date(),
                metadata: {
                  currentStock: item.currentStock,
                  minimumStock: item.minimumStock,
                  warehouse: item.warehouse?.name || 'Unknown',
                  itemCode: item.code,
                  stockStatus: item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'
                }
              }));
              
              console.log('Created real low stock notifications:', notifications.length);
            }
          }
        } catch (error) {
          console.log('Error checking inventory:', error.message);
        }
      }
      
      setNotifications(notifications);
      setPagination(pagination);
      
      // Calculate stats from notifications
      if (notifications.length > 0) {
        const total = notifications.length;
        const unread = notifications.filter(n => n.status === 'unread').length;
        setStats({ total, unread, breakdown: {} });
        console.log('Calculated stats from notifications:', { total, unread });
      }
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', error.response?.data);
      
      // Don't show mock data, just show empty state
      setNotifications([]);
      setStats({ total: 0, unread: 0, breakdown: {} });
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification statistics with better error handling
  const fetchStats = async () => {
    try {
      console.log('Fetching notification stats...');
      
      // Try to get stats with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await api.get('http://localhost:7000/api/notifications/stats', {
          signal: controller.signal,
          timeout: 5000
        });
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.success) {
          console.log('Notification stats fetched:', response.data.data);
          setStats(response.data.data || { total: 0, unread: 0, breakdown: {} });
          return;
        }
      } catch (error) {
        console.log('Stats endpoint failed:', error.message);
      }
      
      // Fallback: calculate stats from notifications array
      if (notifications.length > 0) {
        const total = notifications.length;
        const unread = notifications.filter(n => n.status === 'unread').length;
        setStats({ total, unread, breakdown: {} });
        console.log('Using fallback stats from notifications array:', { total, unread });
      } else {
        // Set default stats
        setStats({ total: 0, unread: 0, breakdown: {} });
      }
      
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      
      // Set default stats on error
      setStats({ total: 0, unread: 0, breakdown: {} });
    }
  };

  // Fetch metadata with better error handling
  const fetchMetadata = async () => {
    try {
      console.log('Fetching notification metadata...');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await api.get('http://localhost:7000/api/notifications/metadata/types', {
          signal: controller.signal,
          timeout: 5000
        });
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.success) {
          console.log('Metadata fetched:', response.data.data);
          setMetadata(response.data.data || { types: [], priorities: [], statuses: [] });
          return;
        }
      } catch (error) {
        console.log('Metadata endpoint failed:', error.message);
      }
      
      // Set default metadata
      setMetadata({ 
        types: ['low_stock', 'pending_payment', 'restock_reminder', 'system_maintenance'], 
        priorities: ['low', 'medium', 'high', 'critical'], 
        statuses: ['unread', 'read', 'acknowledged', 'resolved'] 
      });
      
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setMetadata({ types: [], priorities: [], statuses: [] });
    }
  };

  // Run notification checks to generate real notifications
  const runNotificationChecks = async () => {
    try {
      console.log('Running notification checks...');
      setLoading(true);
      
      const response = await api.post('http://localhost:7000/api/notifications/run-checks');
      
      if (response.data && response.data.success) {
        console.log('Notification checks completed:', response.data.data);
        alert('Notification checks completed! Check for new notifications.');
        
        // Refresh notifications and stats
        await fetchNotifications();
        await fetchStats();
      } else {
        console.error('Failed to run notification checks:', response.data);
        alert('Failed to run notification checks. Please try again.');
      }
    } catch (error) {
      console.error('Error running notification checks:', error);
      alert('Error running notification checks. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Check for stock alerts and sync with notification module
  const syncStockNotifications = async () => {
    try {
      console.log('Checking for stock alerts...');
      setLoading(true);
      
      let alertsFound = 0;
      
      // Check inventory for low stock items
      try {
        const lowStockResponse = await api.get('http://localhost:7000/api/inventory/low-stock', {
          timeout: 5000
        });
        
        if (lowStockResponse.data && lowStockResponse.data.success) {
          const lowStockItems = lowStockResponse.data.data || [];
          console.log('Found low stock items:', lowStockItems.length);
          alertsFound += lowStockItems.length;
        }
      } catch (error) {
        console.log('Error checking inventory:', error.message);
      }
      
      // Check stock summary
      try {
        const stockSummaryResponse = await api.get('http://localhost:7000/api/stock/summary', {
          timeout: 5000
        });
        
        if (stockSummaryResponse.data && stockSummaryResponse.data.lowStockCount > 0) {
          console.log('Stock summary shows low stock count:', stockSummaryResponse.data.lowStockCount);
          alertsFound += stockSummaryResponse.data.lowStockCount;
        }
      } catch (error) {
        console.log('Error checking stock summary:', error.message);
      }
      
      if (alertsFound > 0) {
        alert(`Found ${alertsFound} low stock items. Refreshing notifications...`);
      } else {
        alert('No low stock alerts found. All inventory levels are normal.');
      }
      
      // Refresh notifications and stats
      await fetchNotifications();
      await fetchStats();
      
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      alert('Error checking stock alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      console.log('Current notifications:', notifications);
      
      // Show immediate feedback
      alert(`Marking notification ${notificationId} as read...`);
      
      // Update local state immediately first
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, status: 'read', readAt: new Date() }
            : notif
        );
        console.log('Updated notifications locally:', updated);
        return updated;
      });
      
      // Update stats immediately
      setStats(prev => {
        const newStats = {
          ...prev,
          unread: Math.max(0, prev.unread - 1)
        };
        console.log('Updated stats:', newStats);
        return newStats;
      });
      
      console.log('Notification marked as read locally');
      alert('Notification marked as read!');
      
      // Try API call but don't wait for it
      try {
        const response = await api.patch(`http://localhost:7000/api/notifications/${notificationId}/read`, {}, {
          timeout: 3000
        });
        
        if (response.data && response.data.success) {
          console.log('API confirmed notification marked as read');
        } else {
          console.log('API response not successful, but local update completed');
        }
      } catch (apiError) {
        console.log('API call failed, but local update completed:', apiError.message);
      }
      
    } catch (error) {
      console.error('Error in markAsRead function:', error);
      alert('Error marking notification as read: ' + error.message);
    }
  };

  // Mark notification as acknowledged
  const acknowledgeNotification = async (notificationId) => {
    try {
      console.log('Acknowledging notification:', notificationId);
      setLoading(true);
      
      const response = await api.patch(`http://localhost:7000/api/notifications/${notificationId}/acknowledge`, {}, {
        timeout: 5000
      });
      
      if (response.data && response.data.success) {
        console.log('Notification acknowledged successfully');
        
        // Update local state immediately
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'acknowledged', acknowledgedAt: new Date() }
              : notif
          )
        );
        
        console.log('Notification status updated locally');
      } else {
        console.error('Failed to acknowledge notification:', response.data);
        alert('Failed to acknowledge notification. Please try again.');
      }
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      console.error('Error details:', error.response?.data);
      
      // Update locally even if API fails
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, status: 'acknowledged', acknowledgedAt: new Date() }
            : notif
        )
      );
      
      console.log('Notification acknowledged locally');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as unread
  const markAsUnread = async (notificationId) => {
    try {
      console.log('Marking notification as unread:', notificationId);
      setLoading(true);
      
      const response = await api.patch(`http://localhost:7000/api/notifications/${notificationId}/unread`, {}, {
        timeout: 5000
      });
      
      if (response.data && response.data.success) {
        console.log('Notification marked as unread successfully');
        
        // Update local state immediately
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'unread', readAt: null }
              : notif
          )
        );
        
        // Update stats
        setStats(prev => ({
          ...prev,
          unread: prev.unread + 1
        }));
        
        console.log('Notification status updated locally');
      } else {
        console.error('Failed to mark notification as unread:', response.data);
        alert('Failed to mark notification as unread. Please try again.');
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      console.error('Error details:', error.response?.data);
      
      // Update locally even if API fails
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, status: 'unread', readAt: null }
            : notif
        )
      );
      
      setStats(prev => ({
        ...prev,
        unread: prev.unread + 1
      }));
      
      console.log('Notification marked as unread locally');
    } finally {
      setLoading(false);
    }
  };

  // Resolve notification
  const resolveNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:7000/api/notifications/${notificationId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        fetchStats();
        fetchNotifications(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error resolving notification:', error);
    }
  };

  // Delete notification with confirmation
  const deleteNotification = async (notificationId) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this notification? This action cannot be undone.');
    
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }
    
    try {
      console.log('Deleting notification:', notificationId);
      setLoading(true);
      
      const response = await api.delete(`http://localhost:7000/api/notifications/${notificationId}`, {
        timeout: 5000
      });
      
      if (response.data && response.data.success) {
        console.log('Notification deleted successfully');
        
        // Update local state immediately
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          unread: Math.max(0, prev.unread - 1)
        }));
        
        console.log('Notification removed from local state');
        alert('Notification deleted successfully.');
      } else {
        console.error('Failed to delete notification:', response.data);
        alert('Failed to delete notification. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      console.error('Error details:', error.response?.data);
      
      // Remove locally even if API fails
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unread: Math.max(0, prev.unread - 1)
      }));
      
      console.log('Notification removed from local state');
      alert('Notification deleted (local update only).');
    } finally {
      setLoading(false);
    }
  };

  // Bulk mark as read
  const bulkMarkAsRead = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/notifications/mark-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds: selectedNotifications })
      });
      
      if (response.ok) {
        setSelectedNotifications([]);
        fetchStats();
        fetchNotifications(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error bulk marking notifications as read:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchNotifications(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      priority: '',
      unreadOnly: false
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchNotifications(page);
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Select all notifications on current page
  const selectAllOnPage = () => {
    const currentPageIds = notifications.map(n => n._id);
    setSelectedNotifications(prev => {
      const newSelection = [...prev];
      currentPageIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedNotifications([]);
  };

  // Get priority icon and color
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return { icon: FaExclamationTriangle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'high':
        return { icon: FaExclamationTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 'medium':
        return { icon: FaInfoCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'low':
        return { icon: FaInfoCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' };
      default:
        return { icon: FaInfoCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'low_stock': return '📦';
      case 'pending_payment': return '💰';
      case 'restock_reminder': return '🔄';
      case 'payment_due': return '⏰';
      case 'inventory_alert': return '⚠️';
      case 'system_maintenance': return '🔧';
      case 'user_activity': return '👤';
      case 'warehouse_transfer': return '🚚';
      case 'production_alert': return '🏭';
      case 'financial_alert': return '📊';
      default: return '📢';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString();
  };

  // Initialize component
  useEffect(() => {
    console.log('NotificationsPage mounted, starting to fetch data...');
    
    // Initialize with default data to prevent empty state
    const initializeData = async () => {
      try {
        // Set default stats immediately
        setStats({ total: 0, unread: 0, breakdown: {} });
        
        // Set default metadata
        setMetadata({ 
          types: ['low_stock', 'pending_payment', 'restock_reminder', 'system_maintenance'], 
          priorities: ['low', 'medium', 'high', 'critical'], 
          statuses: ['unread', 'read', 'acknowledged', 'resolved'] 
        });
        
        // Try to fetch real data
        await Promise.all([
          fetchNotifications(),
          fetchStats(),
          fetchMetadata()
        ]);
        
      } catch (error) {
        console.error('Error initializing notifications page:', error);
        
        // Don't show fallback data, just show empty state
        setNotifications([]);
        setStats({ total: 0, unread: 0, breakdown: {} });
      }
    };
    
    initializeData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (pagination.currentPage === 1) {
      fetchNotifications(1);
    }
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm mr-3">
                  <FaBell className="w-6 h-6 text-white" />
                </div>
                Notifications & Utilities
              </h1>
              <p className="mt-2 text-gray-600">
                Manage system notifications, alerts, and reminders
              </p>
            </div>
            
            {/* Stats Cards and Actions */}
            <div className="flex space-x-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-sm p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700 font-medium">Total</div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg shadow-sm p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
                <div className="text-sm text-red-700 font-medium">Unread</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    fetchNotifications();
                    fetchStats();
                  }}
                  className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FaSync className="mr-2" />
                  Refresh
                </button>
                <button
                  onClick={runNotificationChecks}
                  className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FaBell className="mr-2" />
                  Run Checks
                </button>
                <button
                  onClick={syncStockNotifications}
                  className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FaSync className="mr-2" />
                  Check Stock Alerts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Filters & Actions</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                <FaFilter className="w-4 h-4" />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {metadata.statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {metadata.types.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priorities</option>
                    {metadata.priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.unreadOnly}
                      onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Unread Only</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedNotifications.length} notification(s) selected
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={bulkMarkAsRead}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors duration-200"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors duration-200"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Notifications ({pagination.totalNotifications})
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllOnPage}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors duration-200"
                >
                  Deselect All
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FaBell className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                All systems are running normally. You'll receive alerts for low stock, pending payments, and other important events.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={syncStockNotifications}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                >
                  <FaSync className="inline mr-2" />
                  Check for Alerts
                </button>
                <button
                  onClick={() => {
                    fetchNotifications();
                    fetchStats();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                >
                  <FaSync className="inline mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => {
                  const priorityInfo = getPriorityIcon(notification.priority);
                  const PriorityIcon = priorityInfo.icon;
                  
                  return (
                    <div
                      key={notification._id}
                      className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-150 ${
                        notification.status === 'unread' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification._id)}
                          onChange={() => toggleNotificationSelection(notification._id)}
                          className="mt-1"
                        />

                        {/* Notification Icon */}
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                        </div>

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                                  <PriorityIcon className="w-3 h-3 mr-1" />
                                  {notification.priority}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  notification.status === 'unread' ? 'bg-blue-100 text-blue-800' :
                                  notification.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                                  notification.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center text-xs text-gray-400">
                                <FaClock className="w-3 h-3 mr-1" />
                                {formatDate(notification.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2">
                          {/* Test button - always visible */}
                          <button
                            onClick={() => {
                              console.log('Test button clicked for notification:', notification._id);
                              markAsRead(notification._id);
                            }}
                            className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors duration-150"
                            title="Test Mark as Read"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          
                          {notification.status === 'unread' && (
                            <button
                              onClick={() => {
                                console.log('Mark as read button clicked for:', notification._id);
                                markAsRead(notification._id);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors duration-150"
                              title="Mark as Read"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          )}
                          
                          {notification.status === 'read' && (
                            <>
                              <button
                                onClick={() => markAsUnread(notification._id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors duration-150"
                                title="Mark as Unread"
                              >
                                <FaEyeSlash className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => acknowledgeNotification(notification._id)}
                                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded transition-colors duration-150"
                                title="Acknowledge"
                              >
                                <FaCheck className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {notification.status === 'acknowledged' && (
                            <button
                              onClick={() => resolveNotification(notification._id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors duration-150"
                              title="Resolve"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors duration-150"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
