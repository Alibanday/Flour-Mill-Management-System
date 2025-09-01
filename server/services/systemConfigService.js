import SystemConfig from '../model/SystemConfig.js';
import User from '../model/user.js';
import mongoose from 'mongoose';

class SystemConfigService {
  // Get current system configuration
  async getConfiguration() {
    try {
      const config = await SystemConfig.getConfig();
      return config;
    } catch (error) {
      console.error('Error getting system configuration:', error);
      throw new Error(`Error getting system configuration: ${error.message}`);
    }
  }

  // Get user-specific configuration
  async getUserConfiguration(userId) {
    try {
      const config = await SystemConfig.getConfig();
      
      // Get user preferences if they exist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Return configuration with user-specific overrides
      return {
        ...config.toObject(),
        userPreferences: {
          role: user.role,
          warehouse: user.warehouse,
          theme: config.ui.theme,
          notifications: config.notifications
        }
      };
    } catch (error) {
      console.error('Error getting user configuration:', error);
      throw new Error(`Error getting user configuration: ${error.message}`);
    }
  }

  // Update system configuration
  async updateConfiguration(updates, userId) {
    try {
      const config = await SystemConfig.getConfig();
      
      // Validate updates
      const validatedUpdates = this.validateUpdates(updates);
      
      // Update configuration
      const updatedConfig = await config.updateConfig(validatedUpdates, userId);
      
      return updatedConfig;
    } catch (error) {
      console.error('Error updating system configuration:', error);
      throw new Error(`Error updating system configuration: ${error.message}`);
    }
  }

  // Validate configuration updates
  validateUpdates(updates) {
    const validated = {};
    
    // UI validation
    if (updates.ui) {
      validated.ui = {};
      if (updates.ui.theme && ['light', 'dark', 'auto'].includes(updates.ui.theme)) {
        validated.ui.theme = updates.ui.theme;
      }
      if (updates.ui.primaryColor && this.isValidColor(updates.ui.primaryColor)) {
        validated.ui.primaryColor = updates.ui.primaryColor;
      }
      if (updates.ui.secondaryColor && this.isValidColor(updates.ui.secondaryColor)) {
        validated.ui.secondaryColor = updates.ui.secondaryColor;
      }
      if (updates.ui.borderRadius && ['none', 'sm', 'md', 'lg', 'xl'].includes(updates.ui.borderRadius)) {
        validated.ui.borderRadius = updates.ui.borderRadius;
      }
      if (updates.ui.fontSize && ['xs', 'sm', 'base', 'lg', 'xl'].includes(updates.ui.fontSize)) {
        validated.ui.fontSize = updates.ui.fontSize;
      }
      if (typeof updates.ui.compactMode === 'boolean') {
        validated.ui.compactMode = updates.ui.compactMode;
      }
    }

    // Dashboard validation
    if (updates.dashboard) {
      validated.dashboard = {};
      if (updates.dashboard.defaultView && ['grid', 'list', 'cards'].includes(updates.dashboard.defaultView)) {
        validated.dashboard.defaultView = updates.dashboard.defaultView;
      }
      if (typeof updates.dashboard.showQuickActions === 'boolean') {
        validated.dashboard.showQuickActions = updates.dashboard.showQuickActions;
      }
      if (typeof updates.dashboard.showRecentActivity === 'boolean') {
        validated.dashboard.showRecentActivity = updates.dashboard.showRecentActivity;
      }
      if (typeof updates.dashboard.showStatistics === 'boolean') {
        validated.dashboard.showStatistics = updates.dashboard.showStatistics;
      }
      if (updates.dashboard.refreshInterval && 
          updates.dashboard.refreshInterval >= 5000 && 
          updates.dashboard.refreshInterval <= 300000) {
        validated.dashboard.refreshInterval = updates.dashboard.refreshInterval;
      }
    }

    // Notifications validation
    if (updates.notifications) {
      validated.notifications = {};
      if (typeof updates.notifications.emailNotifications === 'boolean') {
        validated.notifications.emailNotifications = updates.notifications.emailNotifications;
      }
      if (typeof updates.notifications.pushNotifications === 'boolean') {
        validated.notifications.pushNotifications = updates.notifications.pushNotifications;
      }
      if (typeof updates.notifications.soundEnabled === 'boolean') {
        validated.notifications.soundEnabled = updates.notifications.soundEnabled;
      }
      if (updates.notifications.notificationTypes) {
        validated.notifications.notificationTypes = {};
        const types = ['lowStock', 'pendingPayment', 'restockReminder', 'systemMaintenance', 'userActivity'];
        types.forEach(type => {
          if (typeof updates.notifications.notificationTypes[type] === 'boolean') {
            validated.notifications.notificationTypes[type] = updates.notifications.notificationTypes[type];
          }
        });
      }
    }

    // System validation
    if (updates.system) {
      validated.system = {};
      if (typeof updates.system.maintenanceMode === 'boolean') {
        validated.system.maintenanceMode = updates.system.maintenanceMode;
      }
      if (updates.system.maintenanceMessage && 
          updates.system.maintenanceMessage.length <= 500) {
        validated.system.maintenanceMessage = updates.system.maintenanceMessage;
      }
      if (updates.system.sessionTimeout && 
          updates.system.sessionTimeout >= 900000 && 
          updates.system.sessionTimeout <= 86400000) {
        validated.system.sessionTimeout = updates.system.sessionTimeout;
      }
      if (updates.system.maxLoginAttempts && 
          updates.system.maxLoginAttempts >= 3 && 
          updates.system.maxLoginAttempts <= 10) {
        validated.system.maxLoginAttempts = updates.system.maxLoginAttempts;
      }
      if (updates.system.passwordPolicy) {
        validated.system.passwordPolicy = {};
        if (updates.system.passwordPolicy.minLength && 
            updates.system.passwordPolicy.minLength >= 6 && 
            updates.system.passwordPolicy.minLength <= 20) {
          validated.system.passwordPolicy.minLength = updates.system.passwordPolicy.minLength;
        }
        if (typeof updates.system.passwordPolicy.requireUppercase === 'boolean') {
          validated.system.passwordPolicy.requireUppercase = updates.system.passwordPolicy.requireUppercase;
        }
        if (typeof updates.system.passwordPolicy.requireLowercase === 'boolean') {
          validated.system.passwordPolicy.requireLowercase = updates.system.passwordPolicy.requireLowercase;
        }
        if (typeof updates.system.passwordPolicy.requireNumbers === 'boolean') {
          validated.system.passwordPolicy.requireNumbers = updates.system.passwordPolicy.requireNumbers;
        }
        if (typeof updates.system.passwordPolicy.requireSpecialChars === 'boolean') {
          validated.system.passwordPolicy.requireSpecialChars = updates.system.passwordPolicy.requireSpecialChars;
        }
      }
    }

    // Export validation
    if (updates.export) {
      validated.export = {};
      if (updates.export.defaultFormat && ['pdf', 'excel', 'csv'].includes(updates.export.defaultFormat)) {
        validated.export.defaultFormat = updates.export.defaultFormat;
      }
      if (typeof updates.export.includeHeaders === 'boolean') {
        validated.export.includeHeaders = updates.export.includeHeaders;
      }
      if (updates.export.maxRowsPerExport && 
          updates.export.maxRowsPerExport >= 1000 && 
          updates.export.maxRowsPerExport <= 50000) {
        validated.export.maxRowsPerExport = updates.export.maxRowsPerExport;
      }
    }

    return validated;
  }

  // Validate color format (hex)
  isValidColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  // Get configuration for specific user preferences
  async getUserConfiguration(userId) {
    try {
      const [systemConfig, user] = await Promise.all([
        SystemConfig.getConfig(),
        User.findById(userId).select('preferences')
      ]);

      // Merge system config with user preferences
      const userConfig = {
        ...systemConfig.toObject(),
        userPreferences: user?.preferences || {}
      };

      return userConfig;
    } catch (error) {
      console.error('Error getting user configuration:', error);
      throw new Error(`Error getting user configuration: ${error.message}`);
    }
  }

  // Apply theme configuration
  async applyTheme(theme) {
    try {
      const config = await SystemConfig.getConfig();
      config.ui.theme = theme;
      await config.save();
      return config;
    } catch (error) {
      console.error('Error applying theme:', error);
      throw new Error(`Error applying theme: ${error.message}`);
    }
  }

  // Check if system is in maintenance mode
  async isMaintenanceMode() {
    try {
      const config = await SystemConfig.getConfig();
      return config.system.maintenanceMode;
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      return false;
    }
  }

  // Get maintenance message
  async getMaintenanceMessage() {
    try {
      const config = await SystemConfig.getConfig();
      return config.system.maintenanceMessage;
    } catch (error) {
      console.error('Error getting maintenance message:', error);
      return 'System is under maintenance. Please try again later.';
    }
  }

  // Get system metadata
  async getMetadata() {
    try {
      const config = await SystemConfig.getConfig();
      
      return {
        version: '1.0.0',
        lastUpdated: config.updatedAt || config.createdAt,
        totalUsers: await User.countDocuments(),
        totalWarehouses: await mongoose.model('Warehouse').countDocuments(),
        totalInventory: await mongoose.model('Inventory').countDocuments(),
        systemStatus: {
          maintenanceMode: config.system.maintenanceMode,
          lastBackup: new Date(),
          uptime: process.uptime()
        },
        features: {
          userManagement: true,
          warehouseManagement: true,
          inventoryManagement: true,
          productionManagement: true,
          salesManagement: true,
          financialManagement: true,
          reporting: true,
          notifications: true,
          themeSwitching: true
        }
      };
    } catch (error) {
      console.error('Error getting metadata:', error);
      throw new Error(`Error getting metadata: ${error.message}`);
    }
  }

  // Reset configuration to defaults
  async resetToDefaults(userId) {
    try {
      const config = await SystemConfig.getConfig();
      
      // Reset to default values
      config.ui = {
        theme: 'light',
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        borderRadius: 'md',
        fontSize: 'base',
        compactMode: false
      };
      
      config.dashboard = {
        defaultView: 'grid',
        showQuickActions: true,
        showRecentActivity: true,
        showStatistics: true,
        refreshInterval: 30000
      };
      
      config.notifications = {
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
      };
      
      config.system = {
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
      };
      
      config.export = {
        defaultFormat: 'pdf',
        includeHeaders: true,
        maxRowsPerExport: 10000
      };

      config.updatedBy = userId;
      await config.save();
      
      return config;
    } catch (error) {
      console.error('Error resetting configuration:', error);
      throw new Error(`Error resetting configuration: ${error.message}`);
    }
  }
}

export default new SystemConfigService();
