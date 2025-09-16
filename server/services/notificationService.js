import Notification from '../model/Notification.js';
import Inventory from '../model/inventory.js';
import Sale from '../model/Sale.js';
import User from '../model/user.js';
import Warehouse from '../model/warehouse.js';

class NotificationService {
  // Utility: find recipients for a warehouse (all Managers of that warehouse + Admins)
  async findRecipientsForWarehouse(warehouseId) {
    const recipients = await User.find({
      $or: [
        { role: 'Admin' },
        { role: 'Manager', warehouse: warehouseId }
      ]
    });
    return recipients.map(u => u._id);
  }

  // Check for low stock items and create alerts
  async checkLowStockAlerts() {
    try {
      const lowStockItems = await Inventory.find({
        $expr: {
          $or: [
            {
              $and: [
                { $gt: ['$minimumStock', 0] },
                { $lte: ['$currentStock', '$minimumStock'] }
              ]
            },
            {
              $and: [
                { $gt: ['$reorderPoint', 0] },
                { $lte: ['$currentStock', '$reorderPoint'] }
              ]
            }
          ]
        }
      }).populate('warehouse');

      const notifications = [];
      
      for (const item of lowStockItems) {
        if (!item.warehouse) continue;

        // Check if notification already exists for this item
        const recipientIds = await this.findRecipientsForWarehouse(item.warehouse._id);

        for (const recipientId of recipientIds) {
          const existsForRecipient = await Notification.findOne({
            type: 'low_stock',
            entityId: item._id,
            recipient: recipientId,
            status: { $in: ['unread', 'acknowledged'] }
          });
          if (existsForRecipient) continue;

          const notification = await Notification.create({
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${item.name} is running low in ${item.warehouse.name}. Current stock: ${item.currentStock}`,
            priority: 'high',
            recipient: recipientId,
            relatedEntity: 'inventory',
            entityId: item._id,
            metadata: {
              currentStock: item.currentStock,
              minimumStock: item.minimumStock,
              warehouse: item.warehouse.name,
              itemCode: item.code
            }
          });
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error checking low stock alerts:', error);
      throw new Error(`Error checking low stock alerts: ${error.message}`);
    }
  }

  // Check for pending payments and create alerts
  async checkPendingPaymentAlerts() {
    try {
      const pendingSales = await Sale.find({
        paymentStatus: { $in: ['Pending', 'Partial'] },
        remainingAmount: { $gt: 0 }
      }).populate('customer');

      const notifications = [];
      
      // Get all managers and admins who should receive payment alerts
      const managers = await User.find({ role: { $in: ['Admin', 'Manager'] } });

      for (const sale of pendingSales) {
        for (const manager of managers) {
          // Check if notification already exists for this sale and manager
          const existingNotification = await Notification.findOne({
            type: 'pending_payment',
            entityId: sale._id,
            recipient: manager._id,
            status: { $in: ['unread', 'acknowledged'] }
          });

          if (!existingNotification) {
            const notification = await Notification.createPendingPaymentAlert(sale, manager);
            notifications.push(notification);
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error checking pending payment alerts:', error);
      throw new Error(`Error checking pending payment alerts: ${error.message}`);
    }
  }

  // Check for restock reminders
  async checkRestockReminders() {
    try {
      const itemsNeedingRestock = await Inventory.find({
        $or: [
          { currentStock: 0 },
          {
            $expr: {
              $and: [
                { $lte: ['$currentStock', { $multiply: ['$reorderPoint', 1.5] }] },
                { $gt: ['$currentStock', '$minimumStock'] }
              ]
            }
          }
        ]
      }).populate('warehouse');

      const notifications = [];
      
      for (const item of itemsNeedingRestock) {
        if (!item.warehouse) continue;

        // Check if restock reminder already exists for this item
        const recipientIds = await this.findRecipientsForWarehouse(item.warehouse._id);
        for (const recipientId of recipientIds) {
          const existsForRecipient = await Notification.findOne({
            type: 'restock_reminder',
            entityId: item._id,
            recipient: recipientId,
            status: { $in: ['unread', 'acknowledged'] }
          });
          if (existsForRecipient) continue;

          const notification = await Notification.create({
            type: 'restock_reminder',
            title: 'Restock Reminder',
            message: `Time to restock ${item.name} in ${item.warehouse.name}`,
            priority: 'medium',
            recipient: recipientId,
            relatedEntity: 'inventory',
            entityId: item._id,
            metadata: {
              currentStock: item.currentStock,
              minimumStock: item.minimumStock,
              reorderPoint: item.reorderPoint,
              warehouse: item.warehouse.name,
              itemCode: item.code
            }
          });
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error checking restock reminders:', error);
      throw new Error(`Error checking restock reminders: ${error.message}`);
    }
  }

  // Create system notification
  async createSystemNotification(type, title, message, priority = 'medium', recipients = []) {
    try {
      if (recipients.length === 0) {
        // If no specific recipients, send to all managers and admins
        recipients = await User.find({
          role: { $in: ['Admin', 'Manager'] }
        });
      }

      const notifications = [];
      
      for (const recipient of recipients) {
        const notification = await Notification.create({
          type,
          title,
          message,
          priority,
          recipient: recipient._id,
          relatedEntity: 'system',
          metadata: {
            systemGenerated: true,
            timestamp: new Date()
          }
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw new Error(`Error creating system notification: ${error.message}`);
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        priority,
        unreadOnly = false
      } = options;

      const query = { recipient: userId };
      
      if (status) query.status = status;
      if (type) query.type = type;
      if (priority) query.priority = priority;
      if (unreadOnly) query.status = { $in: ['unread', 'acknowledged'] };

      const notifications = await Notification.find(query)
        .populate('sender', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error(`Error getting user notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      return await notification.markAsRead();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  // Mark notification as acknowledged
  async acknowledgeNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      return await notification.acknowledge();
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      throw new Error(`Error acknowledging notification: ${error.message}`);
    }
  }

  // Resolve notification
  async resolveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      return await notification.resolve();
    } catch (error) {
      console.error('Error resolving notification:', error);
      throw new Error(`Error resolving notification: ${error.message}`);
    }
  }

  // Get notification statistics for a user
  async getUserNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { recipient: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await Notification.countDocuments({ recipient: userId });
      const unread = await Notification.countDocuments({ 
        recipient: userId, 
        status: { $in: ['unread', 'acknowledged'] } 
      });

      return {
        total,
        unread,
        breakdown: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw new Error(`Error getting notification stats: ${error.message}`);
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      return result;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw new Error(`Error cleaning up expired notifications: ${error.message}`);
    }
  }

  // Run all checks (to be called by cron job)
  async runAllChecks() {
    try {
      const results = {
        lowStockAlerts: [],
        pendingPaymentAlerts: [],
        restockReminders: [],
        errors: []
      };

      try {
        results.lowStockAlerts = await this.checkLowStockAlerts();
      } catch (error) {
        results.errors.push(`Low stock check failed: ${error.message}`);
      }

      try {
        results.pendingPaymentAlerts = await this.checkPendingPaymentAlerts();
      } catch (error) {
        results.errors.push(`Pending payment check failed: ${error.message}`);
      }

      try {
        results.restockReminders = await this.checkRestockReminders();
      } catch (error) {
        results.errors.push(`Restock reminder check failed: ${error.message}`);
      }

      // Clean up expired notifications
      try {
        await this.cleanupExpiredNotifications();
      } catch (error) {
        results.errors.push(`Cleanup failed: ${error.message}`);
      }

      return results;
    } catch (error) {
      console.error('Error running notification checks:', error);
      throw new Error(`Error running notification checks: ${error.message}`);
    }
  }
}

export default new NotificationService();
