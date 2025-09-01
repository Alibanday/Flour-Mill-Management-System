import Sale from '../model/Sale.js';
import Inventory from '../model/inventory.js';
import FinancialTransaction from '../model/FinancialTransaction.js';
import Employee from '../model/Employee.js';
import Supplier from '../model/Supplier.js';
import BagPurchase from '../model/BagPurchase.js';
import FoodPurchase from '../model/FoodPurchase.js';
import Production from '../model/Production.js';

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
        .populate('customer', 'name contact')
        .populate('items.product', 'name category')
        .sort({ saleDate: -1 });

      const summary = {
        totalSales: sales.length,
        totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalQuantity: sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
        averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0,
        paymentBreakdown: {
          paid: sales.filter(sale => sale.paymentStatus === 'paid').length,
          pending: sales.filter(sale => sale.paymentStatus === 'pending').length,
          partial: sales.filter(sale => sale.paymentStatus === 'partial').length
        }
      };

      return {
        reportType: 'sales',
        title: `Sales Report (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
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
      const query = warehouseId ? { warehouse: warehouseId } : {};
      
      const inventory = await Inventory.find(query)
        .populate('warehouse', 'name location')
        .populate('product', 'name category unit')
        .sort({ 'warehouse.name': 1, 'product.name': 1 });

      const summary = {
        totalItems: inventory.length,
        totalWarehouses: [...new Set(inventory.map(item => item.warehouse._id.toString()))].length,
        lowStockItems: inventory.filter(item => item.quantity <= item.reorderLevel).length,
        outOfStockItems: inventory.filter(item => item.quantity === 0).length,
        totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        warehouseBreakdown: {}
      };

      // Group by warehouse
      inventory.forEach(item => {
        const warehouseName = item.warehouse.name;
        if (!summary.warehouseBreakdown[warehouseName]) {
          summary.warehouseBreakdown[warehouseName] = {
            items: 0,
            value: 0,
            lowStock: 0
          };
        }
        summary.warehouseBreakdown[warehouseName].items++;
        summary.warehouseBreakdown[warehouseName].value += item.quantity * item.unitPrice;
        if (item.quantity <= item.reorderLevel) {
          summary.warehouseBreakdown[warehouseName].lowStock++;
        }
      });

      return {
        reportType: 'inventory',
        title: 'Inventory Report - All Warehouses',
        data: inventory,
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
        saleDate: { $gte: start, $lte: end },
        paymentStatus: { $in: ['paid', 'partial'] }
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
        transactionType: 'salary'
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
        .sort({ transactionDate: -1 });

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
        const month = expense.date.toISOString().substring(0, 7);
        if (!summary.monthlyBreakdown[month]) {
          summary.monthlyBreakdown[month] = 0;
        }
        summary.monthlyBreakdown[month] += expense.amount;
      });

      return {
        reportType: 'expense',
        title: `Expense Report (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
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
        transactionType: 'salary'
      };

      if (employeeId) query.employee = employeeId;

      const salaries = await FinancialTransaction.find(query)
        .populate('employee', 'firstName lastName email department')
        .sort({ transactionDate: -1 });

      const summary = {
        totalSalaries: salaries.length,
        totalAmount: salaries.reduce((sum, salary) => sum + salary.amount, 0),
        averageSalary: salaries.length > 0 ? salaries.reduce((sum, salary) => sum + salary.amount, 0) / salaries.length : 0,
        departmentBreakdown: {},
        monthlyBreakdown: {}
      };

      // Group by department
      salaries.forEach(salary => {
        const dept = salary.employee?.department || 'Unknown';
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
