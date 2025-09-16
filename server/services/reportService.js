import Sale from '../model/Sale.js';
import Inventory from '../model/inventory.js';
import FinancialTransaction from '../model/FinancialTransaction.js';
import Employee from '../model/Employee.js';
import Supplier from '../model/Supplier.js';
import BagPurchase from '../model/BagPurchase.js';
import FoodPurchase from '../model/FoodPurchase.js';
import Production from '../model/Production.js';
import mongoose from 'mongoose';

class ReportService {
  // Generate Sales Report by Date Range
  async generateSalesReport(startDate, endDate, filters = {}) {
    try {
      const query = {
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      // Apply additional filters
      if (filters.customer) query.customer = filters.customer;
      if (filters.productType) query.productType = filters.productType;
      if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;

      const sales = await Sale.find(query)
        .populate('warehouse', 'name location')
        .sort({ saleDate: -1 });

      const summary = {
        totalSales: sales.length,
        totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalQuantity: sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
        averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0,
        paymentBreakdown: {
          paid: sales.filter(sale => /paid/i.test(sale.paymentStatus)).length,
          pending: sales.filter(sale => /pending/i.test(sale.paymentStatus)).length,
          partial: sales.filter(sale => /partial/i.test(sale.paymentStatus)).length
        }
      };

      return {
        reportType: 'sales',
        title: `Sales Report (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
        dateRange: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        data: sales,
        summary,
        filters: { startDate, endDate, ...filters }
      };
    } catch (error) {
      throw new Error(`Error generating sales report: ${error.message}`);
    }
  }

  // Generate Inventory Report for Warehouses
  async generateInventoryReport(warehouseId = null) {
    try {
      let query = {};
      if (warehouseId && mongoose.isValidObjectId(warehouseId)) {
        query.warehouse = warehouseId;
      }
      
      const inventory = (await Inventory.find(query)
        .populate('warehouse', 'name location'))
        .map(doc => doc); // ensure plain iteration

      // Sort in JS to avoid DB sort on populated paths
      inventory.sort((a, b) => {
        const wa = a.warehouse?.name || '';
        const wb = b.warehouse?.name || '';
        if (wa === wb) {
          return (a.name || '').localeCompare(b.name || '');
        }
        return wa.localeCompare(wb);
      });

      const summary = {
        totalItems: Array.isArray(inventory) ? inventory.length : 0,
        totalWarehouses: Array.isArray(inventory)
          ? [...new Set(inventory.filter(i => i?.warehouse?._id).map(item => item.warehouse._id.toString()))].length
          : 0,
        lowStockItems: Array.isArray(inventory)
          ? inventory.filter(item => (item?.currentStock ?? 0) <= (item?.minimumStock ?? 0)).length
          : 0,
        outOfStockItems: Array.isArray(inventory)
          ? inventory.filter(item => (item?.currentStock ?? 0) === 0).length
          : 0,
        totalValue: Array.isArray(inventory)
          ? inventory.reduce((sum, item) => sum + ((item?.currentStock ?? 0) * (item?.cost?.purchasePrice ?? 0)), 0)
          : 0,
        warehouseBreakdown: {}
      };

      // Group by warehouse
      (inventory || []).forEach(item => {
        const warehouseName = item.warehouse?.name || 'Unassigned';
        if (!summary.warehouseBreakdown[warehouseName]) {
          summary.warehouseBreakdown[warehouseName] = {
            items: 0,
            value: 0,
            lowStock: 0
          };
        }
        summary.warehouseBreakdown[warehouseName].items++;
        summary.warehouseBreakdown[warehouseName].value += ((item?.currentStock ?? 0) * (item?.cost?.purchasePrice ?? 0));
        if ((item?.currentStock ?? 0) <= (item?.minimumStock ?? 0)) {
          summary.warehouseBreakdown[warehouseName].lowStock++;
        }
      });

      // Normalize data for frontend expectations
      const normalized = (inventory || []).map(item => ({
        product: { name: item.name },
        warehouse: item.warehouse ? { name: item.warehouse.name } : null,
        quantity: item.currentStock || 0,
        unit: item.unit || 'kg',
        unitPrice: item.cost?.purchasePrice || 0,
        reorderLevel: item.minimumStock || 0,
        code: item.code || ''
      }));

      return {
        reportType: 'inventory',
        title: 'Inventory Report - All Warehouses',
        dateRange: {},
        data: normalized,
        summary,
        filters: { warehouseId }
      };
    } catch (error) {
      throw new Error(`Error generating inventory report: ${error.message}`);
    }
  }

  // Generate Profit & Loss Report
  async generateProfitLossReport(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get sales revenue
      const sales = await Sale.find({
        saleDate: { $gte: start, $lte: end }
      });

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Get cost of goods sold (COGS)
      const bagPurchases = await BagPurchase.find({
        purchaseDate: { $gte: start, $lte: end }
      });

      const foodPurchases = await FoodPurchase.find({
        purchaseDate: { $gte: start, $lte: end }
      });

      const totalCOGS = bagPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0) +
                       foodPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

      // Get expenses
      const expenses = await FinancialTransaction.find({
        date: { $gte: start, $lte: end },
        transactionType: 'expense'
      });

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Get salaries
      const salaries = await FinancialTransaction.find({
        date: { $gte: start, $lte: end },
        transactionType: 'expense',
        category: 'salaries'
      });

      const totalSalaries = salaries.reduce((sum, salary) => sum + salary.amount, 0);

      // Calculate profit/loss
      const grossProfit = totalRevenue - totalCOGS;
      const netProfit = grossProfit - totalExpenses - totalSalaries;

      const summary = {
        period: { startDate: start, endDate: end },
        revenue: {
          sales: totalRevenue,
          total: totalRevenue
        },
        costs: {
          cogs: totalCOGS,
          expenses: totalExpenses,
          salaries: totalSalaries,
          total: totalCOGS + totalExpenses + totalSalaries
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        }
      };

      return {
        reportType: 'profit-loss',
        title: `Profit & Loss Report (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`,
        dateRange: {
          startDate: start,
          endDate: end
        },
        data: {
          sales,
          bagPurchases,
          foodPurchases,
          expenses,
          salaries
        },
        summary,
        filters: { startDate, endDate }
      };
    } catch (error) {
      throw new Error(`Error generating profit & loss report: ${error.message}`);
    }
  }

  // Generate Expense Report
  async generateExpenseReport(startDate, endDate, category = null) {
    try {
      const query = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        transactionType: 'expense'
      };

      if (category) query.category = category;

      const expenses = await FinancialTransaction.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1 });

      const summary = {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        averageExpense: expenses.length > 0 ? expenses.reduce((sum, expense) => sum + expense.amount, 0) / expenses.length : 0,
        categoryBreakdown: {},
        monthlyBreakdown: {}
      };

      // Group by category
      expenses.forEach(expense => {
        const cat = expense.category || 'Uncategorized';
        if (!summary.categoryBreakdown[cat]) {
          summary.categoryBreakdown[cat] = { count: 0, amount: 0 };
        }
        summary.categoryBreakdown[cat].count++;
        summary.categoryBreakdown[cat].amount += expense.amount;

        // Group by month
        const month = (expense.date instanceof Date ? expense.date : new Date(expense.date)).toISOString().substring(0, 7);
        if (!summary.monthlyBreakdown[month]) {
          summary.monthlyBreakdown[month] = 0;
        }
        summary.monthlyBreakdown[month] += expense.amount;
      });

      return {
        reportType: 'expense',
        title: `Expense Report (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
        dateRange: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        data: expenses,
        summary,
        filters: { startDate, endDate, category }
      };
    } catch (error) {
      throw new Error(`Error generating expense report: ${error.message}`);
    }
  }

  // Generate Employee Salary Report
  async generateSalaryReport(startDate, endDate, employeeId = null) {
    try {
      const query = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        transactionType: 'expense',
        category: 'salaries'
      };

      if (employeeId) query.createdBy = employeeId;

      const salaries = await FinancialTransaction.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ date: -1 });

      const summary = {
        totalSalaries: salaries.length,
        totalAmount: salaries.reduce((sum, salary) => sum + salary.amount, 0),
        averageSalary: salaries.length > 0 ? salaries.reduce((sum, salary) => sum + salary.amount, 0) / salaries.length : 0,
        departmentBreakdown: {},
        monthlyBreakdown: {}
      };

      // Group by department (using user role as department)
      salaries.forEach(salary => {
        const dept = salary.createdBy?.role || 'Unknown';
        if (!summary.departmentBreakdown[dept]) {
          summary.departmentBreakdown[dept] = { count: 0, amount: 0 };
        }
        summary.departmentBreakdown[dept].count++;
        summary.departmentBreakdown[dept].amount += salary.amount;

        // Group by month
        const month = salary.date.toISOString().substring(0, 7);
        if (!summary.monthlyBreakdown[month]) {
          summary.monthlyBreakdown[month] = 0;
        }
        summary.monthlyBreakdown[month] += salary.amount;
      });

      return {
        reportType: 'salary',
        title: `Employee Salary Report (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
        dateRange: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        data: salaries,
        summary,
        filters: { startDate, endDate, employeeId }
      };
    } catch (error) {
      throw new Error(`Error generating salary report: ${error.message}`);
    }
  }

  // Generate Vendor Outstanding Report
  async generateVendorOutstandingReport() {
    try {
      const suppliers = await Supplier.find().sort({ name: 1 });
      
      const vendorOutstanding = [];

      for (const supplier of suppliers) {
        // Get bag purchases
        const bagPurchases = await BagPurchase.find({
          supplier: supplier._id,
          paymentStatus: { $in: ['pending', 'partial'] }
        });

        // Get food purchases
        const foodPurchases = await FoodPurchase.find({
          supplier: supplier._id,
          paymentStatus: { $in: ['pending', 'partial'] }
        });

        const totalOutstanding = bagPurchases.reduce((sum, purchase) => sum + purchase.dueAmount, 0) +
                               foodPurchases.reduce((sum, purchase) => sum + purchase.dueAmount, 0);

        if (totalOutstanding > 0) {
          vendorOutstanding.push({
            supplier: supplier,
            bagPurchases,
            foodPurchases,
            totalOutstanding,
            lastPurchaseDate: Math.max(
              ...bagPurchases.map(p => p.purchaseDate),
              ...foodPurchases.map(p => p.purchaseDate),
              new Date(0)
            )
          });
        }
      }

      const summary = {
        totalVendors: vendorOutstanding.length,
        totalOutstanding: vendorOutstanding.reduce((sum, vendor) => sum + vendor.totalOutstanding, 0),
        averageOutstanding: vendorOutstanding.length > 0 ? vendorOutstanding.reduce((sum, vendor) => sum + vendor.totalOutstanding, 0) / vendorOutstanding.length : 0,
        overdueVendors: vendorOutstanding.filter(vendor => 
          vendor.lastPurchaseDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length
      };

      return {
        reportType: 'vendor-outstanding',
        title: 'Vendor Outstanding Report',
        dateRange: {},
        data: vendorOutstanding,
        summary,
        filters: {}
      };
    } catch (error) {
      throw new Error(`Error generating vendor outstanding report: ${error.message}`);
    }
  }
}

export default new ReportService();
