import Notification from "../model/Notification.js";
import Inventory from "../model/inventory.js";
import Warehouse from "../model/warehouse.js";
import User from "../model/user.js";
import { isOfflineModeEnabled, mockDatabase } from "../config/offline-mode.js";

class NotificationService {
  // Create notification for low stock
  static async createLowStockAlert(inventoryItem, user) {
    try {
      const notification = new Notification({
        title: "Low Stock Alert",
        message: `${inventoryItem.name} is running low (${inventoryItem.currentStock} units remaining)`,
        type: "inventory",
        priority: "high",
        user: user,
        relatedEntity: "inventory",
        entityId: inventoryItem._id,
        data: {
          productId: inventoryItem._id,
          productName: inventoryItem.name,
          currentStock: inventoryItem.currentStock,
          minimumStock: inventoryItem.minimumStock,
          warehouse: inventoryItem.warehouse
        }
      });

      await notification.save();
      console.log(`Low stock alert created for ${inventoryItem.name}`);
      return notification;
    } catch (error) {
      console.error("Error creating low stock alert:", error);
      throw error;
    }
  }

  // Create notification for out of stock
  static async createOutOfStockAlert(inventoryItem, user) {
    try {
      const notification = new Notification({
        title: "Product Out of Stock",
        message: `${inventoryItem.name} is now out of stock`,
        type: "inventory",
        priority: "critical",
        user: user,
        relatedEntity: "inventory",
        entityId: inventoryItem._id,
        data: {
          productId: inventoryItem._id,
          productName: inventoryItem.name,
          currentStock: 0,
          warehouse: inventoryItem.warehouse
        }
      });

      await notification.save();
      console.log(`Out of stock alert created for ${inventoryItem.name}`);
      return notification;
    } catch (error) {
      console.error("Error creating out of stock alert:", error);
      throw error;
    }
  }

  // Create notification for production completion
  static async createProductionAlert(production, user) {
    try {
      const notification = new Notification({
        title: "Production Completed",
        message: `Production batch ${production.batchNumber} for ${production.productName} has been completed`,
        type: "production",
        priority: "medium",
        user: user,
        data: {
          productionId: production._id,
          batchNumber: production.batchNumber,
          productName: production.productName,
          quantity: production.quantity.value,
          warehouse: production.warehouse
        }
      });

      await notification.save();
      console.log(`Production alert created for batch ${production.batchNumber}`);
      return notification;
    } catch (error) {
      console.error("Error creating production alert:", error);
      throw error;
    }
  }

  // Create notification for sale completion
  static async createSalesAlert(sale, user) {
    try {
      const notification = new Notification({
        title: "Sale Completed",
        message: `Sale invoice ${sale.invoiceNumber} has been processed successfully`,
        type: "sales",
        priority: "low",
        user: user,
        data: {
          saleId: sale._id,
          invoiceNumber: sale.invoiceNumber,
          totalAmount: sale.totalAmount,
          customerName: sale.customer.name,
          warehouse: sale.warehouse
        }
      });

      await notification.save();
      console.log(`Sales alert created for invoice ${sale.invoiceNumber}`);
      return notification;
    } catch (error) {
      console.error("Error creating sales alert:", error);
      throw error;
    }
  }

  // Create notification for purchase completion
  static async createPurchaseAlert(purchase, user) {
    try {
      const notification = new Notification({
        title: "Purchase Completed",
        message: `Purchase ${purchase.purchaseNumber} has been processed and inventory updated`,
        type: "purchase",
        priority: "low",
        user: user,
        data: {
          purchaseId: purchase._id,
          purchaseNumber: purchase.purchaseNumber,
          totalAmount: purchase.totalAmount,
          supplierName: purchase.supplier.name,
          warehouse: purchase.warehouse
        }
      });

      await notification.save();
      console.log(`Purchase alert created for ${purchase.purchaseNumber}`);
      return notification;
    } catch (error) {
      console.error("Error creating purchase alert:", error);
      throw error;
    }
  }

  // Create notification for stock transfer
  static async createStockTransferAlert(transfer, user) {
    try {
      const notification = new Notification({
        title: "Stock Transfer Completed",
        message: `Stock transfer of ${transfer.quantity} units has been completed`,
        type: "stock",
        priority: "medium",
        user: user,
        data: {
          transferId: transfer._id,
          quantity: transfer.quantity,
          fromWarehouse: transfer.fromWarehouse,
          toWarehouse: transfer.toWarehouse,
          productName: transfer.productName
        }
      });

      await notification.save();
      console.log(`Stock transfer alert created`);
      return notification;
    } catch (error) {
      console.error("Error creating stock transfer alert:", error);
      throw error;
    }
  }

  // Create notification for warehouse capacity
  static async createWarehouseCapacityAlert(warehouse, user) {
    try {
      const notification = new Notification({
        title: "Warehouse Capacity Alert",
        message: `Warehouse ${warehouse.name} is at ${warehouse.capacityPercentage}% capacity`,
        type: "warehouse",
        priority: "medium",
        user: user,
        data: {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          currentUsage: warehouse.capacity.currentUsage,
          totalCapacity: warehouse.capacity.totalCapacity,
          capacityPercentage: warehouse.capacityPercentage
        }
      });

      await notification.save();
      console.log(`Warehouse capacity alert created for ${warehouse.name}`);
      return notification;
    } catch (error) {
      console.error("Error creating warehouse capacity alert:", error);
      throw error;
    }
  }

  // Create generic notification
  static async createNotification({
    type,
    title,
    message,
    priority = "medium",
    user = null,
    recipient = null,
    relatedEntity = null,
    entityId = null,
    data = {},
    metadata = {}
  }) {
    try {
      const notification = new Notification({
        type: type,
        title: title,
        message: message,
        priority: priority,
        user: user,
        recipient: recipient,
        relatedEntity: relatedEntity,
        entityId: entityId,
        data: data,
        metadata: metadata
      });

      await notification.save();
      console.log(`Notification created: ${title}`);
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Create system notification
  static async createSystemNotification(title, message, priority = "medium", user = null) {
    try {
      const notification = new Notification({
        title: title,
        message: message,
        type: "system",
        priority: priority,
        user: user,
        data: {
          timestamp: new Date(),
          systemGenerated: true
        }
      });

      await notification.save();
      console.log(`System notification created: ${title}`);
      return notification;
    } catch (error) {
      console.error("Error creating system notification:", error);
      throw error;
    }
  }

  // Get notifications for user
  static async getUserNotifications(userId, limit = 50, skip = 0) {
    try {
      const notifications = await Notification.find({
        $or: [
          { user: userId },
          { recipient: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('user', 'firstName lastName')
      .populate('recipient', 'firstName lastName');

      return notifications;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }

  // Get unread notifications count
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        $or: [
          { user: userId },
          { recipient: userId }
        ],
        status: 'unread'
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          $or: [
            { user: userId },
            { recipient: userId }
          ]
        },
        {
          status: 'read',
          readAt: new Date()
        },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        {
          $or: [
            { user: userId },
            { recipient: userId }
          ],
          status: 'unread'
        },
        {
          status: 'read',
          readAt: new Date()
        }
      );

      return result;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        $or: [
          { user: userId },
          { recipient: userId }
        ]
      });

      return notification;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        {
          $match: {
            $or: [
              { user: userId },
              { recipient: userId }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ["$status", "unread"] }, 1, 0]
              }
            },
            byType: {
              $push: {
                type: "$type",
                priority: "$priority"
              }
            }
          }
        }
      ]);

      return stats[0] || { total: 0, unread: 0, byType: [] };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      throw error;
    }
  }

  // Get user notification statistics
  static async getUserNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        {
          $match: {
            $or: [
              { user: userId },
              { recipient: userId }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ["$status", "unread"] }, 1, 0]
              }
            },
            byType: {
              $push: {
                type: "$type",
                status: "$status",
                priority: "$priority"
              }
            }
          }
        }
      ]);

      return stats[0] || { total: 0, unread: 0, byType: [] };
    } catch (error) {
      console.error("Error getting user notification stats:", error);
      throw error;
    }
  }

  // Run all notification checks
  static async runAllChecks() {
    try {
      console.log("Running notification checks...");
      
      // Check if offline mode is enabled
      if (isOfflineModeEnabled()) {
        console.log("🔄 Offline mode: Skipping notification checks");
        return { success: true, message: "Notification checks skipped (offline mode)" };
      }
      
      // Check for low stock items - simplified query
      const allItems = await Inventory.find({}).lean();
      
      for (const item of allItems) {
        const threshold = item.minimumStock * 1.2;
        if (item.currentStock <= threshold) {
          // Create low stock alert
          await this.createLowStockAlert(item, null);
        }
      }

      // Check for out of stock items
      const outOfStockItems = await Inventory.find({
        currentStock: { $lte: 0 }
      });

      for (const item of outOfStockItems) {
        await this.createOutOfStockAlert(item, null);
      }

      // Clean up expired notifications
      await this.cleanupExpiredNotifications();

      console.log("Notification checks completed");
      return { success: true, message: "All checks completed" };
    } catch (error) {
      console.error("Error running notification checks:", error);
      throw error;
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`Cleaned up ${result.deletedCount} expired notifications`);
      return result;
    } catch (error) {
      console.error("Error cleaning up expired notifications:", error);
      throw error;
    }
  }
}

export default NotificationService;