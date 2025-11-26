import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import ReportService from '../services/reportService.js';
import Report from '../model/Report.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Restrict all report routes to Admin and General Manager only
router.use(authorize('Admin', 'General Manager'));

// Validation middleware
const validateDateRange = [
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('startDate').custom((value, { req }) => {
    if (new Date(value) > new Date(req.body.endDate)) {
      throw new Error('Start date cannot be after end date');
    }
    return true;
  })
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

// Generate Sales Report by Date Range (FR 35)
router.post('/sales', validateDateRange, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, filters = {} } = req.body;
    
    const report = await ReportService.generateSalesReport(startDate, endDate, filters);
    
    // Save report to database
    const savedReport = new Report({
      ...report,
      generatedBy: req.user.id || req.user._id
    });
    await savedReport.save();

    res.json({
      success: true,
      message: 'Sales report generated successfully',
      data: report,
      reportId: savedReport._id
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales report',
      error: error.message
    });
  }
}));

// Generate Inventory Report for Warehouses (FR 36)
router.post('/inventory', asyncHandler(async (req, res) => {
  try {
    const { warehouseId } = req.body;
    
    const report = await ReportService.generateInventoryReport(warehouseId);
    
    // Save report to database
    const savedReport = new Report({
      ...report,
      generatedBy: req.user.id || req.user._id
    });
    await savedReport.save();

    res.json({
      success: true,
      message: 'Inventory report generated successfully',
      data: report,
      reportId: savedReport._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating inventory report',
      error: error.message
    });
  }
}));

// Generate Profit & Loss Report (FR 37)
router.post('/profit-loss', validateDateRange, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const report = await ReportService.generateProfitLossReport(startDate, endDate);
    
    // Save report to database
    const savedReport = new Report({
      ...report,
      generatedBy: req.user.id || req.user._id
    });
    await savedReport.save();

    res.json({
      success: true,
      message: 'Profit & Loss report generated successfully',
      data: report,
      reportId: savedReport._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating profit & loss report',
      error: error.message
    });
  }
}));

// Generate Expense Report (FR 38)
router.post('/expense', validateDateRange, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, category } = req.body;
    
    const report = await ReportService.generateExpenseReport(startDate, endDate, category);
    
    // Save report to database
    const savedReport = new Report({
      ...report,
      generatedBy: req.user.id || req.user._id
    });
    await savedReport.save();

    res.json({
      success: true,
      message: 'Expense report generated successfully',
      data: report,
      reportId: savedReport._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating expense report',
      error: error.message
    });
  }
}));

// Generate Employee Salary Report (FR 39)
router.post('/salary', validateDateRange, handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.body;
    
    const report = await ReportService.generateSalaryReport(startDate, endDate, employeeId);
    
    // Save report to database
    const savedReport = new Report({
      ...report,
      generatedBy: req.user.id || req.user._id
    });
    await savedReport.save();

    res.json({
      success: true,
      message: 'Employee salary report generated successfully',
      data: report,
      reportId: savedReport._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating salary report',
      error: error.message
    });
  }
}));

// Generate Vendor Outstanding Report (FR 40)
router.post('/vendor-outstanding', asyncHandler(async (req, res) => {
  try {
    const report = await ReportService.generateVendorOutstandingReport();
    
    // Save report to database
    const savedReport = new Report({
      ...report,
      generatedBy: req.user.id || req.user._id
    });
    await savedReport.save();

    res.json({
      success: true,
      message: 'Vendor outstanding report generated successfully',
      data: report,
      reportId: savedReport._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating vendor outstanding report',
      error: error.message
    });
  }
}));

// Get all generated reports
router.get('/all', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, reportType, startDate, endDate } = req.query;
    
    const query = {};
    if (reportType) query.reportType = reportType;
    if (startDate && endDate) {
      query.generatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'firstName lastName email')
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReports: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
}));

// Get a specific report by ID
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'firstName lastName email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
}));

// Delete a report
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Only allow deletion by the user who generated it or admin
    if (report.generatedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reports'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
}));

// Get report statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const reportsByType = await Report.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentReports = await Report.find()
      .sort({ generatedAt: -1 })
      .limit(5)
      .populate('generatedBy', 'firstName lastName');

    const monthlyStats = await Report.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$generatedAt' },
            month: { $month: '$generatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      data: {
        totalReports,
        reportsByType,
        recentReports,
        monthlyStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report statistics',
      error: error.message
    });
  }
}));

export default router; 