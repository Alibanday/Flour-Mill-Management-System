import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  // UI/UX Configuration
  ui: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    primaryColor: {
      type: String,
      default: '#3B82F6' // Blue
    },
    secondaryColor: {
      type: String,
      default: '#6B7280' // Gray
    },
    borderRadius: {
      type: String,
      enum: ['none', 'sm', 'md', 'lg', 'xl'],
      default: 'md'
    },
    fontSize: {
      type: String,
      enum: ['xs', 'sm', 'base', 'lg', 'xl'],
      default: 'base'
    },
    compactMode: {
      type: Boolean,
      default: false
    }
  },

  // Dashboard Configuration
  dashboard: {
    defaultView: {
      type: String,
      enum: ['grid', 'list', 'cards'],
      default: 'grid'
    },
    showQuickActions: {
      type: Boolean,
      default: true
    },
    showRecentActivity: {
      type: Boolean,
      default: true
    },
    showStatistics: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 30000, // 30 seconds
      min: 5000,
      max: 300000
    }
  },

  // Notification Preferences
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    notificationTypes: {
      lowStock: { type: Boolean, default: true },
      pendingPayment: { type: Boolean, default: true },
      restockReminder: { type: Boolean, default: true },
      systemMaintenance: { type: Boolean, default: true },
      userActivity: { type: Boolean, default: false }
    }
  },

  // System Settings
  system: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'System is under maintenance. Please try again later.'
    },
    sessionTimeout: {
      type: Number,
      default: 3600000, // 1 hour in milliseconds
      min: 900000, // 15 minutes minimum
      max: 86400000 // 24 hours maximum
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    passwordPolicy: {
      minLength: { type: Number, default: 8, min: 6, max: 20 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: false }
    }
  },

  // Data Export Settings
  export: {
    defaultFormat: {
      type: String,
      enum: ['pdf', 'excel', 'csv'],
      default: 'pdf'
    },
    includeHeaders: {
      type: Boolean,
      default: true
    },
    maxRowsPerExport: {
      type: Number,
      default: 10000,
      min: 1000,
      max: 50000
    }
  },

  // Created and updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one configuration exists
systemConfigSchema.index({}, { unique: true });

// Static method to get or create configuration
systemConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
           // Create default configuration
       config = await this.create({
         createdBy: undefined, // No user required for default config
      ui: {
        theme: 'light',
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        borderRadius: 'md',
        fontSize: 'base',
        compactMode: false
      },
      dashboard: {
        defaultView: 'grid',
        showQuickActions: true,
        showRecentActivity: true,
        showStatistics: true,
        refreshInterval: 30000
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
        notificationTypes: {
          lowStock: true,
          pendingPayment: true,
          restockReminder: true,
          systemMaintenance: true,
          userActivity: false
        }
      },
      system: {
        maintenanceMode: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.',
        sessionTimeout: 3600000,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        }
      },
      export: {
        defaultFormat: 'pdf',
        includeHeaders: true,
        maxRowsPerExport: 10000
      }
    });
  }
  return config;
};

// Instance method to update configuration
systemConfigSchema.methods.updateConfig = async function(updates, userId) {
  Object.assign(this, updates);
  this.updatedBy = userId;
  return await this.save();
};

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
