import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'low_stock',
      'pending_payment',
      'restock_reminder',
      'payment_due',
      'inventory_alert',
      'system_maintenance',
      'user_activity',
      'warehouse_transfer',
      'production_alert',
      'financial_alert',
      'production',
      'sales',
      'purchase',
      'inventory',
      'stock',
      'warehouse',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'acknowledged', 'resolved'],
    default: 'unread'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedEntity: {
    type: String,
    enum: ['inventory', 'sale', 'purchase', 'payment', 'production', 'warehouse', 'user', 'system'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedEntity'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  readAt: {
    type: Date
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods for creating notifications
notificationSchema.statics.createLowStockAlert = function(inventoryItem, warehouse) {
  return this.create({
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `${inventoryItem.product.name} is running low in ${warehouse.name}. Current quantity: ${inventoryItem.quantity}`,
    priority: 'high',
    recipient: warehouse.manager,
    relatedEntity: 'inventory',
    entityId: inventoryItem._id,
    metadata: {
      currentQuantity: inventoryItem.quantity,
      reorderLevel: inventoryItem.reorderLevel,
      warehouse: warehouse.name,
      product: inventoryItem.product.name
    }
  });
};

notificationSchema.statics.createPendingPaymentAlert = function(payment, user) {
  return this.create({
    type: 'pending_payment',
    title: 'Pending Payment Alert',
    message: `Payment of ${payment.amount} is pending for ${payment.customer?.name || 'Customer'}`,
    priority: 'medium',
    recipient: user._id,
    relatedEntity: 'payment',
    entityId: payment._id,
    metadata: {
      amount: payment.amount,
      dueDate: payment.dueDate,
      customerName: payment.customer?.name
    }
  });
};

notificationSchema.statics.createRestockReminder = function(inventoryItem, warehouse) {
  return this.create({
    type: 'restock_reminder',
    title: 'Restock Reminder',
    message: `Time to restock ${inventoryItem.product.name} in ${warehouse.name}`,
    priority: 'medium',
    recipient: warehouse.manager,
    relatedEntity: 'inventory',
    entityId: inventoryItem._id,
    metadata: {
      currentQuantity: inventoryItem.quantity,
      reorderLevel: inventoryItem.reorderLevel,
      lastRestockDate: inventoryItem.lastRestockDate
    }
  });
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.acknowledge = function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  return this.save();
};

notificationSchema.methods.resolve = function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

// Pre-save middleware to set expiration for certain types
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set default expiration based on type and priority
    const now = new Date();
    switch (this.priority) {
      case 'critical':
        this.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
        break;
      case 'high':
        this.expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        break;
      case 'medium':
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
        break;
      case 'low':
        this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
        break;
    }
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
