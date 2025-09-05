import express from "express";
import { body, validationResult } from "express-validator";
import ProductionCostService from "../services/productionCostService.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ========================================
// PRODUCTION COST ROUTES (FR 16)
// ========================================

// Get daily production cost
router.get("/daily", authorize("'Admin'", "'Manager'"), [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('warehouseId').optional().isMongoId().withMessage('Valid warehouse ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { date, warehouseId } = req.query;
    
    const dailyCost = await ProductionCostService.calculateDailyProductionCost(date, warehouseId);
    
    res.json({
      success: true,
      data: dailyCost
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get production cost trends
router.get("/trends", authorize("'Admin'", "'Manager'"), [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('warehouseId').optional().isMongoId().withMessage('Valid warehouse ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { startDate, endDate, warehouseId } = req.query;
    
    const trends = await ProductionCostService.getProductionCostTrends(startDate, endDate, warehouseId);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get product cost analysis
router.get("/product-analysis", authorize("'Admin'", "'Manager'"), [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { startDate, endDate } = req.query;
    
    const analysis = await ProductionCostService.getProductCostAnalysis(startDate, endDate);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cost efficiency metrics
router.get("/efficiency", authorize("'Admin'", "'Manager'"), [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { startDate, endDate } = req.query;
    
    const metrics = await ProductionCostService.getCostEfficiencyMetrics(startDate, endDate);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cost breakdown for specific production
router.get("/production/:id", authorize("'Admin'", "'Manager'", "'Employee'"), async (req, res) => {
  try {
    const Production = (await import('../model/Production.js')).default;
    
    const production = await Production.findById(req.params.id)
      .populate('warehouse', 'name')
      .populate('rawMaterials.material', 'name unitPrice')
      .populate('createdBy', 'firstName lastName');
    
    if (!production) {
      return res.status(404).json({ success: false, message: 'Production record not found' });
    }
    
    const costBreakdown = await ProductionCostService.calculateProductionCost(production);
    
    res.json({
      success: true,
      data: costBreakdown
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cost summary for date range
router.get("/summary", authorize("'Admin'", "'Manager'"), [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { startDate, endDate } = req.query;
    
    const trends = await ProductionCostService.getProductionCostTrends(startDate, endDate);
    
    // Calculate summary statistics
    const totalCost = trends.reduce((sum, day) => sum + day.totalCost, 0);
    const totalProductions = trends.reduce((sum, day) => sum + day.totalProductions, 0);
    const totalQuantity = trends.reduce((sum, day) => 
      sum + day.productions.reduce((prodSum, prod) => prodSum + prod.quantity, 0), 0
    );
    
    const costBreakdown = {
      rawMaterials: trends.reduce((sum, day) => sum + day.costBreakdown.rawMaterials, 0),
      labor: trends.reduce((sum, day) => sum + day.costBreakdown.labor, 0),
      overhead: trends.reduce((sum, day) => sum + day.costBreakdown.overhead, 0),
      utilities: trends.reduce((sum, day) => sum + day.costBreakdown.utilities, 0),
      maintenance: trends.reduce((sum, day) => sum + day.costBreakdown.maintenance, 0)
    };
    
    const summary = {
      period: {
        startDate: startDate,
        endDate: endDate,
        days: trends.length
      },
      totals: {
        totalCost: totalCost,
        totalProductions: totalProductions,
        totalQuantity: totalQuantity
      },
      averages: {
        averageDailyCost: totalCost / trends.length,
        averageCostPerProduction: totalCost / totalProductions,
        averageCostPerUnit: totalCost / totalQuantity
      },
      costBreakdown: costBreakdown,
      costBreakdownPercentages: {
        rawMaterials: (costBreakdown.rawMaterials / totalCost) * 100,
        labor: (costBreakdown.labor / totalCost) * 100,
        overhead: (costBreakdown.overhead / totalCost) * 100,
        utilities: (costBreakdown.utilities / totalCost) * 100,
        maintenance: (costBreakdown.maintenance / totalCost) * 100
      }
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cost comparison between periods
router.get("/comparison", authorize("'Admin'", "'Manager'"), [
  body('period1Start').isISO8601().withMessage('Valid period 1 start date is required'),
  body('period1End').isISO8601().withMessage('Valid period 1 end date is required'),
  body('period2Start').isISO8601().withMessage('Valid period 2 start date is required'),
  body('period2End').isISO8601().withMessage('Valid period 2 end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { period1Start, period1End, period2Start, period2End } = req.query;
    
    const [period1Trends, period2Trends] = await Promise.all([
      ProductionCostService.getProductionCostTrends(period1Start, period1End),
      ProductionCostService.getProductionCostTrends(period2Start, period2End)
    ]);
    
    const period1Total = period1Trends.reduce((sum, day) => sum + day.totalCost, 0);
    const period2Total = period2Trends.reduce((sum, day) => sum + day.totalCost, 0);
    
    const comparison = {
      period1: {
        startDate: period1Start,
        endDate: period1End,
        totalCost: period1Total,
        averageDailyCost: period1Total / period1Trends.length,
        totalProductions: period1Trends.reduce((sum, day) => sum + day.totalProductions, 0)
      },
      period2: {
        startDate: period2Start,
        endDate: period2End,
        totalCost: period2Total,
        averageDailyCost: period2Total / period2Trends.length,
        totalProductions: period2Trends.reduce((sum, day) => sum + day.totalProductions, 0)
      },
      comparison: {
        costDifference: period2Total - period1Total,
        costDifferencePercentage: ((period2Total - period1Total) / period1Total) * 100,
        averageDailyCostDifference: (period2Total / period2Trends.length) - (period1Total / period1Trends.length),
        trend: period2Total > period1Total ? 'Increasing' : period2Total < period1Total ? 'Decreasing' : 'Stable'
      }
    };
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

