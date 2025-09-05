import Production from '../model/Production.js';
import Inventory from '../model/inventory.js';
import Stock from '../model/stock.js';
import Salary from '../model/Salary.js';

class ProductionCostService {
  
  /**
   * Calculate daily production cost for a specific date
   * @param {Date} date - The date to calculate costs for
   * @param {string} warehouseId - Optional warehouse filter
   * @returns {Object} Cost breakdown
   */
  static async calculateDailyProductionCost(date, warehouseId = null) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Build query
      const query = {
        productionDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      if (warehouseId) {
        query.warehouse = warehouseId;
      }
      
      // Get production records
      const productions = await Production.find(query)
        .populate('warehouse', 'name')
        .populate('rawMaterials.material', 'name unitPrice')
        .populate('createdBy', 'firstName lastName');
      
      if (productions.length === 0) {
        return {
          date: date,
          totalProductions: 0,
          totalCost: 0,
          costBreakdown: {
            rawMaterials: 0,
            labor: 0,
            overhead: 0,
            utilities: 0,
            maintenance: 0
          },
          productions: []
        };
      }
      
      // Calculate costs for each production
      const productionCosts = await Promise.all(
        productions.map(production => this.calculateProductionCost(production))
      );
      
      // Aggregate total costs
      const totalCost = productionCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
      
      const costBreakdown = {
        rawMaterials: productionCosts.reduce((sum, cost) => sum + cost.rawMaterialsCost, 0),
        labor: productionCosts.reduce((sum, cost) => sum + cost.laborCost, 0),
        overhead: productionCosts.reduce((sum, cost) => sum + cost.overheadCost, 0),
        utilities: productionCosts.reduce((sum, cost) => sum + cost.utilitiesCost, 0),
        maintenance: productionCosts.reduce((sum, cost) => sum + cost.maintenanceCost, 0)
      };
      
      return {
        date: date,
        totalProductions: productions.length,
        totalCost: totalCost,
        costBreakdown: costBreakdown,
        averageCostPerUnit: totalCost / productions.reduce((sum, prod) => sum + prod.quantity, 0),
        productions: productionCosts
      };
      
    } catch (error) {
      throw new Error(`Error calculating daily production cost: ${error.message}`);
    }
  }
  
  /**
   * Calculate cost for a single production record
   * @param {Object} production - Production record
   * @returns {Object} Cost breakdown for the production
   */
  static async calculateProductionCost(production) {
    try {
      // Calculate raw materials cost
      const rawMaterialsCost = production.rawMaterials.reduce((total, material) => {
        return total + (material.quantity * material.unitPrice);
      }, 0);
      
      // Calculate labor cost
      const laborCost = await this.calculateLaborCost(production);
      
      // Calculate overhead cost (percentage of raw materials + labor)
      const overheadCost = (rawMaterialsCost + laborCost) * 0.15; // 15% overhead
      
      // Calculate utilities cost (based on production quantity)
      const utilitiesCost = production.quantity * 0.5; // Rs. 0.5 per unit
      
      // Calculate maintenance cost (based on production hours)
      const maintenanceCost = production.productionHours * 100; // Rs. 100 per hour
      
      const totalCost = rawMaterialsCost + laborCost + overheadCost + utilitiesCost + maintenanceCost;
      const costPerUnit = totalCost / production.quantity;
      
      return {
        productionId: production._id,
        batchNumber: production.batchNumber,
        productName: production.productName,
        quantity: production.quantity,
        totalCost: totalCost,
        costPerUnit: costPerUnit,
        rawMaterialsCost: rawMaterialsCost,
        laborCost: laborCost,
        overheadCost: overheadCost,
        utilitiesCost: utilitiesCost,
        maintenanceCost: maintenanceCost,
        costBreakdown: {
          rawMaterials: {
            cost: rawMaterialsCost,
            percentage: (rawMaterialsCost / totalCost) * 100
          },
          labor: {
            cost: laborCost,
            percentage: (laborCost / totalCost) * 100
          },
          overhead: {
            cost: overheadCost,
            percentage: (overheadCost / totalCost) * 100
          },
          utilities: {
            cost: utilitiesCost,
            percentage: (utilitiesCost / totalCost) * 100
          },
          maintenance: {
            cost: maintenanceCost,
            percentage: (maintenanceCost / totalCost) * 100
          }
        }
      };
      
    } catch (error) {
      throw new Error(`Error calculating production cost: ${error.message}`);
    }
  }
  
  /**
   * Calculate labor cost for production
   * @param {Object} production - Production record
   * @returns {number} Labor cost
   */
  static async calculateLaborCost(production) {
    try {
      // Get average hourly rate from salary records
      const salaryRecords = await Salary.find({
        status: 'Active'
      }).populate('employee', 'role');
      
      if (salaryRecords.length === 0) {
        // Default labor cost if no salary records
        return production.productionHours * 500; // Rs. 500 per hour
      }
      
      // Calculate average hourly rate
      const totalMonthlySalary = salaryRecords.reduce((sum, salary) => {
        return sum + salary.basicSalary + salary.allowances;
      }, 0);
      
      const averageHourlyRate = (totalMonthlySalary / salaryRecords.length) / (30 * 8); // Assuming 8 hours per day, 30 days per month
      
      return production.productionHours * averageHourlyRate;
      
    } catch (error) {
      // Fallback to default rate
      return production.productionHours * 500;
    }
  }
  
  /**
   * Get production cost trends for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} warehouseId - Optional warehouse filter
   * @returns {Array} Daily cost trends
   */
  static async getProductionCostTrends(startDate, endDate, warehouseId = null) {
    try {
      const trends = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dailyCost = await this.calculateDailyProductionCost(currentDate, warehouseId);
        trends.push(dailyCost);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return trends;
      
    } catch (error) {
      throw new Error(`Error getting production cost trends: ${error.message}`);
    }
  }
  
  /**
   * Get cost analysis by product
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Product cost analysis
   */
  static async getProductCostAnalysis(startDate, endDate) {
    try {
      const productions = await Production.find({
        productionDate: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('rawMaterials.material', 'name unitPrice');
      
      const productCosts = {};
      
      for (const production of productions) {
        const cost = await this.calculateProductionCost(production);
        
        if (!productCosts[production.productName]) {
          productCosts[production.productName] = {
            productName: production.productName,
            totalQuantity: 0,
            totalCost: 0,
            averageCostPerUnit: 0,
            productionCount: 0
          };
        }
        
        productCosts[production.productName].totalQuantity += production.quantity;
        productCosts[production.productName].totalCost += cost.totalCost;
        productCosts[production.productName].productionCount += 1;
      }
      
      // Calculate averages
      Object.values(productCosts).forEach(product => {
        product.averageCostPerUnit = product.totalCost / product.totalQuantity;
      });
      
      return Object.values(productCosts);
      
    } catch (error) {
      throw new Error(`Error getting product cost analysis: ${error.message}`);
    }
  }
  
  /**
   * Get cost efficiency metrics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Efficiency metrics
   */
  static async getCostEfficiencyMetrics(startDate, endDate) {
    try {
      const trends = await this.getProductionCostTrends(startDate, endDate);
      
      const totalCost = trends.reduce((sum, day) => sum + day.totalCost, 0);
      const totalProductions = trends.reduce((sum, day) => sum + day.totalProductions, 0);
      const totalQuantity = trends.reduce((sum, day) => 
        sum + day.productions.reduce((prodSum, prod) => prodSum + prod.quantity, 0), 0
      );
      
      const averageDailyCost = totalCost / trends.length;
      const averageCostPerProduction = totalCost / totalProductions;
      const averageCostPerUnit = totalCost / totalQuantity;
      
      // Calculate cost variance
      const costVariances = trends.map(day => Math.pow(day.totalCost - averageDailyCost, 2));
      const costVariance = costVariances.reduce((sum, variance) => sum + variance, 0) / trends.length;
      const costStandardDeviation = Math.sqrt(costVariance);
      
      return {
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
          averageDailyCost: averageDailyCost,
          averageCostPerProduction: averageCostPerProduction,
          averageCostPerUnit: averageCostPerUnit
        },
        efficiency: {
          costVariance: costVariance,
          costStandardDeviation: costStandardDeviation,
          costStability: costStandardDeviation < (averageDailyCost * 0.1) ? 'Stable' : 'Variable'
        }
      };
      
    } catch (error) {
      throw new Error(`Error getting cost efficiency metrics: ${error.message}`);
    }
  }
}

export default ProductionCostService;

