import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import NotificationService from '../services/notificationService.js';
import Notification from '../model/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Validation middleware
const validateNotification = [
  body('type').isIn([
    'low_stock',
    'pending_payment',
    'restock_reminder',
    'payment_due',
    'inventory_alert',
    'system_maintenance',
    'user_activity',
    'warehouse_transfer',
    'production_alert',
    'financial_alert'
  ]).withMessage('Invalid notification type'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority level'),
  body('recipients').optional().isArray().withMessage('Recipients must be an array')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get user's notifications (FR 50) - Base route
router.get('/', asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      priority,
      unreadOnly
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      priority,
      unreadOnly: unreadOnly === 'true'
    };

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const result = await NotificationService.getUserNotifications(userId, options, userRole);

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
}));

// Get user's notifications (FR 50) - All route
router.get('/all', asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      priority,
      unreadOnly
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      priority,
      unreadOnly: unreadOnly === 'true'
    };

    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const result = await NotificationService.getUserNotifications(userId, options, userRole);

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
}));

// Get notification statistics for user
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const stats = await NotificationService.getUserNotificationStats(userId, userRole);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification statistics',
      error: error.message
    });
  }
}));

// Mark notification as read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notification = await NotificationService.markAsRead(req.params.id, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
}));

// Mark notification as acknowledged
router.patch('/:id/acknowledge', asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notification = await NotificationService.acknowledgeNotification(req.params.id, userId);

    res.json({
      success: true,
      message: 'Notification acknowledged',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error acknowledging notification',
      error: error.message
    });
  }
}));

// Resolve notification
router.patch('/:id/resolve', asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notification = await NotificationService.resolveNotification(req.params.id, userId);

    res.json({
      success: true,
      message: 'Notification resolved',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving notification',
      error: error.message
    });
  }
}));

// Mark multiple notifications as read
router.patch('/mark-read', [
  body('notificationIds').isArray().withMessage('Notification IDs must be an array')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const results = [];

    for (const id of notificationIds) {
      try {
        const userId = req.user._id || req.user.id;
        const notification = await NotificationService.markAsRead(id, userId);
        results.push({ id, success: true, data: notification });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Bulk update completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
      error: error.message
    });
  }
}));

// Create manual notification (Admin/Manager only)
router.post('/', validateNotification, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    // Check if user has permission to create notifications
    if (!['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Admins and Managers can create notifications'
      });
    }

    const { type, title, message, priority = 'medium', recipients = [] } = req.body;

    let notifications;
    if (recipients.length > 0) {
      notifications = await NotificationService.createSystemNotification(
        type,
        title,
        message,
        priority,
        recipients
      );
    } else {
      notifications = await NotificationService.createSystemNotification(
        type,
        title,
        message,
        priority
      );
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
}));

// Run system notification checks (Admin only)
router.post('/run-checks', asyncHandler(async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins can run system notification checks'
      });
    }

    const results = await NotificationService.runAllChecks();

    res.json({
      success: true,
      message: 'System notification checks completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error running notification checks',
      error: error.message
    });
  }
}));

// Get a specific notification by ID
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sender', 'firstName lastName email')
      .populate('recipient', 'firstName lastName email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user has access to this notification
    const userId = req.user._id || req.user.id;
    if (notification.recipient._id.toString() !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
}));

// Delete a notification (Admin or notification owner)
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user can delete this notification
    const userId = req.user._id || req.user.id;
    if (notification.recipient.toString() !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own notifications'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
}));

// Get notification types and priorities (for frontend forms)
router.get('/metadata/types', asyncHandler(async (req, res) => {
  try {
    const types = [
      'low_stock',
      'pending_payment',
      'restock_reminder',
      'payment_due',
      'inventory_alert',
      'system_maintenance',
      'user_activity',
      'warehouse_transfer',
      'production_alert',
      'financial_alert'
    ];

    const priorities = ['low', 'medium', 'high', 'critical'];

    const statuses = ['unread', 'read', 'acknowledged', 'resolved'];

    res.json({
      success: true,
      data: {
        types,
        priorities,
        statuses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification metadata',
      error: error.message
    });
  }
}));

export default router;
