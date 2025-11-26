import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import SystemConfigService from '../services/systemConfigService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Validation middleware
const validateConfigUpdate = [
  body('ui.theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme'),
  body('ui.primaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid primary color format'),
  body('ui.secondaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid secondary color format'),
  body('ui.borderRadius').optional().isIn(['none', 'sm', 'md', 'lg', 'xl']).withMessage('Invalid border radius'),
  body('ui.fontSize').optional().isIn(['xs', 'sm', 'base', 'lg', 'xl']).withMessage('Invalid font size'),
  body('ui.compactMode').optional().isBoolean().withMessage('Compact mode must be boolean'),
  
  body('dashboard.defaultView').optional().isIn(['grid', 'list', 'cards']).withMessage('Invalid dashboard view'),
  body('dashboard.showQuickActions').optional().isBoolean().withMessage('Show quick actions must be boolean'),
  body('dashboard.showRecentActivity').optional().isBoolean().withMessage('Show recent activity must be boolean'),
  body('dashboard.showStatistics').optional().isBoolean().withMessage('Show statistics must be boolean'),
  body('dashboard.refreshInterval').optional().isInt({ min: 5000, max: 300000 }).withMessage('Refresh interval must be between 5 and 300 seconds'),
  
  body('notifications.emailNotifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('notifications.pushNotifications').optional().isBoolean().withMessage('Push notifications must be boolean'),
  body('notifications.soundEnabled').optional().isBoolean().withMessage('Sound enabled must be boolean'),
  body('notifications.notificationTypes.*').optional().isBoolean().withMessage('Notification type must be boolean'),
  
  body('system.maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be boolean'),
  body('system.maintenanceMessage').optional().isLength({ max: 500 }).withMessage('Maintenance message too long'),
  body('system.sessionTimeout').optional().isInt({ min: 900000, max: 86400000 }).withMessage('Session timeout must be between 15 minutes and 24 hours'),
  body('system.maxLoginAttempts').optional().isInt({ min: 3, max: 10 }).withMessage('Max login attempts must be between 3 and 10'),
  body('system.passwordPolicy.minLength').optional().isInt({ min: 6, max: 20 }).withMessage('Password min length must be between 6 and 20'),
  body('system.passwordPolicy.requireUppercase').optional().isBoolean().withMessage('Require uppercase must be boolean'),
  body('system.passwordPolicy.requireLowercase').optional().isBoolean().withMessage('Require lowercase must be boolean'),
  body('system.passwordPolicy.requireNumbers').optional().isBoolean().withMessage('Require numbers must be boolean'),
  body('system.passwordPolicy.requireSpecialChars').optional().isBoolean().withMessage('Require special chars must be boolean'),
  
  body('export.defaultFormat').optional().isIn(['pdf', 'excel', 'csv']).withMessage('Invalid export format'),
  body('export.includeHeaders').optional().isBoolean().withMessage('Include headers must be boolean'),
  body('export.maxRowsPerExport').optional().isInt({ min: 1000, max: 50000 }).withMessage('Max rows per export must be between 1000 and 50000')
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

// Get current system configuration - Base route
router.get('/', asyncHandler(async (req, res) => {
  try {
    const config = await SystemConfigService.getConfiguration();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system configuration',
      error: error.message
    });
  }
}));

// Get current system configuration - All route
router.get('/all', asyncHandler(async (req, res) => {
  try {
    const config = await SystemConfigService.getConfiguration();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system configuration',
      error: error.message
    });
  }
}));

// Get user-specific configuration
router.get('/user', asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const config = await SystemConfigService.getUserConfiguration(userId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user configuration',
      error: error.message
    });
  }
}));

// Update system configuration (Admin only)
router.put('/', validateConfigUpdate, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins can update system configuration'
      });
    }

    const userId = req.user._id || req.user.id;
    const updatedConfig = await SystemConfigService.updateConfiguration(req.body, userId);
    
    res.json({
      success: true,
      message: 'System configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating system configuration',
      error: error.message
    });
  }
}));

// Apply theme (any authenticated user)
router.patch('/theme', [
  body('theme').isIn(['light', 'dark', 'auto']).withMessage('Invalid theme')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { theme } = req.body;
    const updatedConfig = await SystemConfigService.applyTheme(theme);
    
    res.json({
      success: true,
      message: 'Theme updated successfully',
      data: updatedConfig.ui
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating theme',
      error: error.message
    });
  }
}));

// Reset configuration to defaults (Admin only)
router.post('/reset', asyncHandler(async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins can reset system configuration'
      });
    }

    const userId = req.user._id || req.user.id;
    const resetConfig = await SystemConfigService.resetToDefaults(userId);
    
    res.json({
      success: true,
      message: 'System configuration reset to defaults successfully',
      data: resetConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting system configuration',
      error: error.message
    });
  }
}));

// Get system metadata (available options for frontend forms)
router.get('/metadata', asyncHandler(async (req, res) => {
  try {
    const metadata = {
      themes: ['light', 'dark', 'auto'],
      colors: {
        primary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
        secondary: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6']
      },
      borderRadius: ['none', 'sm', 'md', 'lg', 'xl'],
      fontSize: ['xs', 'sm', 'base', 'lg', 'xl'],
      dashboardViews: ['grid', 'list', 'cards'],
      exportFormats: ['pdf', 'excel', 'csv'],
      refreshIntervals: [
        { value: 5000, label: '5 seconds' },
        { value: 10000, label: '10 seconds' },
        { value: 30000, label: '30 seconds' },
        { value: 60000, label: '1 minute' },
        { value: 300000, label: '5 minutes' }
      ],
      sessionTimeouts: [
        { value: 900000, label: '15 minutes' },
        { value: 1800000, label: '30 minutes' },
        { value: 3600000, label: '1 hour' },
        { value: 7200000, label: '2 hours' },
        { value: 86400000, label: '24 hours' }
      ],
      loginAttempts: [3, 4, 5, 6, 7, 8, 9, 10],
      passwordLengths: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      exportRowLimits: [
        { value: 1000, label: '1,000 rows' },
        { value: 5000, label: '5,000 rows' },
        { value: 10000, label: '10,000 rows' },
        { value: 25000, label: '25,000 rows' },
        { value: 50000, label: '50,000 rows' }
      ]
    };
    
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration metadata',
      error: error.message
    });
  }
}));

// Check maintenance mode status
router.get('/maintenance', asyncHandler(async (req, res) => {
  try {
    const [isMaintenanceMode, maintenanceMessage] = await Promise.all([
      SystemConfigService.isMaintenanceMode(),
      SystemConfigService.getMaintenanceMessage()
    ]);
    
    res.json({
      success: true,
      data: {
        maintenanceMode: isMaintenanceMode,
        message: maintenanceMessage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking maintenance mode',
      error: error.message
    });
  }
}));

export default router;
