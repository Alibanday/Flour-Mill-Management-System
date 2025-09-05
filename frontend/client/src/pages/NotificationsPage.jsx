import React, { useState, useEffect } from 'react';
import { FaBell, FaFilter, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaClock, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

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

  // Fetch notifications
  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });

      const response = await fetch(`http://localhost:7000/api/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  // Fetch metadata
  const fetchMetadata = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/notifications/metadata/types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetadata(data.data);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:7000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'read' }
              : notif
          )
        );
        fetchStats();
        fetchNotifications(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark notification as acknowledged
  const acknowledgeNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:7000/api/notifications/${notificationId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'acknowledged' }
              : notif
          )
        );
        fetchStats();
        fetchNotifications(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error acknowledging notification:', error);
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

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:7000/api/notifications/${notificationId}`, {
        method: 'DELETE',
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
      console.error('Error deleting notification:', error);
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
    fetchNotifications();
    fetchStats();
    fetchMetadata();
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
                <FaBell className="w-8 h-8 text-blue-600 mr-3" />
                Notifications & Utilities
              </h1>
              <p className="mt-2 text-gray-600">
                Manage system notifications, alerts, and reminders
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex space-x-4">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
                <div className="text-sm text-gray-500">Unread</div>
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
            <div className="px-6 py-12 text-center">
              <FaBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
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
                          {notification.status === 'unread' && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors duration-150"
                              title="Mark as Read"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          )}
                          
                          {notification.status === 'read' && (
                            <button
                              onClick={() => acknowledgeNotification(notification._id)}
                              className="p-2 text-yellow-600 hover:bg-yellow-100 rounded transition-colors duration-150"
                              title="Acknowledge"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
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
