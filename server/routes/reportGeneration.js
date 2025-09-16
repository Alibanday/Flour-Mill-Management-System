import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import ReportService from '../services/reportService.js';
import Report from '../model/Report.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

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
      generatedBy: req.user.id
    });
    await savedReport.save();

    res.json({
      success: true,
      message: 'Sales report generated successfully',
      data: report,
      reportId: savedReport._id
    });
  } catch (error) {
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
      generatedBy: req.user.id
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
      generatedBy: req.user.id
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
      generatedBy: req.user.id
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
      generatedBy: req.user.id
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
      generatedBy: req.user.id
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

export default router;