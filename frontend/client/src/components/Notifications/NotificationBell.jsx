import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaClock } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=10&unreadOnly=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
        setUnreadCount(data.data.length);
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
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setUnreadCount(data.data.unread);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'read' }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark notification as acknowledged
  const acknowledgeNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'acknowledged' }
              : notif
          )
        );
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  };

  // Resolve notification
  const resolveNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error resolving notification:', error);
    }
  };

  // Get priority icon and color
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return { icon: FaExclamationTriangle, color: 'text-red-600' };
      case 'high':
        return { icon: FaExclamationTriangle, color: 'text-orange-600' };
      case 'medium':
        return { icon: FaInfoCircle, color: 'text-blue-600' };
      case 'low':
        return { icon: FaInfoCircle, color: 'text-gray-600' };
      default:
        return { icon: FaInfoCircle, color: 'text-gray-600' };
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'low_stock':
        return '📦';
      case 'pending_payment':
        return '💰';
      case 'restock_reminder':
        return '🔄';
      case 'payment_due':
        return '⏰';
      case 'inventory_alert':
        return '⚠️';
      case 'system_maintenance':
        return '🔧';
      case 'user_activity':
        return '👤';
      case 'warehouse_transfer':
        return '🚚';
      case 'production_alert':
        return '🏭';
      case 'financial_alert':
        return '📊';
      default:
        return '📢';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on component mount and set up polling
  useEffect(() => {
    fetchNotifications();
    fetchStats();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchStats();
    }
  }, [user]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200"
        aria-label="Notifications"
      >
        <FaBell className="w-5 h-5" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {stats.unread} unread
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FaBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const PriorityIcon = getPriorityIcon(notification.priority).icon;
                  const priorityColor = getPriorityIcon(notification.priority).color;
                  
                  return (
                    <div
                      key={notification._id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                        notification.status === 'unread' ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Notification Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTypeIcon(notification.type)}</span>
                          <PriorityIcon className={`w-4 h-4 ${priorityColor}`} />
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {notification.priority}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center">
                          <FaClock className="w-3 h-3 mr-1" />
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      {/* Notification Content */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {notification.status === 'unread' && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-150 flex items-center space-x-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            <span>Mark Read</span>
                          </button>
                        )}
                        
                        {notification.status === 'read' && (
                          <button
                            onClick={() => acknowledgeNotification(notification._id)}
                            className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors duration-150 flex items-center space-x-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                        
                        {notification.status === 'acknowledged' && (
                          <button
                            onClick={() => resolveNotification(notification._id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-150 flex items-center space-x-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium text-center"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
