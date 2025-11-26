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
        .populate('customer', 'name customerName')
        .populate('items.product', 'name code')
        .sort({ saleDate: -1 });

      const summary = {
        totalSales: sales.length,
        totalAmount: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
        totalQuantity: sales.reduce((sum, sale) => {
          const items = sale.items || [];
          return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
        }, 0),
        averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / sales.length : 0,
        paymentBreakdown: {
          paid: sales.filter(sale => sale.paymentStatus && /paid/i.test(sale.paymentStatus)).length,
          pending: sales.filter(sale => sale.paymentStatus && /pending/i.test(sale.paymentStatus)).length,
          partial: sales.filter(sale => sale.paymentStatus && /partial/i.test(sale.paymentStatus)).length
        }
      };

      // Format sales data for frontend
      const formattedSales = sales.map(sale => {
        // Ensure customer is an object with name
        let customerData = sale.customer;
        if (!customerData || typeof customerData !== 'object') {
          customerData = { name: 'Unknown Customer' };
        } else if (typeof customerData === 'string') {
          customerData = { name: customerData };
        }
        
        // Ensure items have product information
        const formattedItems = (sale.items || []).map(item => {
          const product = item.product || {};
          let itemData;
          try {
            itemData = typeof item.toObject === 'function' ? item.toObject() : (item || {});
          } catch (e) {
            itemData = item || {};
          }
          return {
            ...itemData,
            product: {
              name: item.productName || product.name || 'Unknown Product',
              code: product.code || ''
            }
          };
        });
        
        let saleData;
        try {
          saleData = typeof sale.toObject === 'function' ? sale.toObject() : (sale || {});
        } catch (e) {
          saleData = sale || {};
        }
        
        return {
          ...saleData,
          customer: customerData,
          items: formattedItems
        };
      });

      return {
        reportType: 'sales',
        title: `Sales Report (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
        dateRange: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        data: formattedSales,
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
      
      const inventoryDocs = await Inventory.find(query)
        .populate('product', 'name code category subcategory unit price purchasePrice')
        .populate('warehouse', 'name location code');
      
      // Convert to plain objects safely
      const inventory = Array.isArray(inventoryDocs) 
        ? inventoryDocs.map(doc => {
            try {
              return doc.toObject ? doc.toObject() : (typeof doc === 'object' ? doc : {});
            } catch (error) {
              console.error('Error converting inventory doc to object:', error);
              return typeof doc === 'object' ? doc : {};
            }
          })
        : [];

      // Sort in JS to avoid DB sort on populated paths
      inventory.sort((a, b) => {
        const wa = a.warehouse?.name || '';
        const wb = b.warehouse?.name || '';
        if (wa === wb) {
          const nameA = a.product?.name || a.name || '';
          const nameB = b.product?.name || b.name || '';
          return nameA.localeCompare(nameB);
        }
        return wa.localeCompare(wb);
      });

      // Helper function to get unit price from item
      const getUnitPrice = (item) => {
        // Try different possible price fields in order of preference
        if (item.product?.purchasePrice) return item.product.purchasePrice;
        if (item.product?.price) return item.product.price;
        if (item.price) return item.price;
        if (item.cost?.purchasePrice) return item.cost.purchasePrice;
        return 0;
      };

      // Helper function to get product name
      const getProductName = (item) => {
        return item.product?.name || item.name || 'Unnamed Product';
      };

      // Helper function to get product code
      const getProductCode = (item) => {
        return item.product?.code || item.code || '';
      };

      // Helper function to get unit
      const getUnit = (item) => {
        return item.product?.unit || item.unit || 'units';
      };

      const summary = {
        totalItems: Array.isArray(inventory) ? inventory.length : 0,
        totalWarehouses: Array.isArray(inventory)
          ? [...new Set(inventory.filter(i => i?.warehouse?._id).map(item => item.warehouse._id.toString()))].length
          : 0,
        lowStockItems: Array.isArray(inventory)
          ? inventory.filter(item => {
              const currentStock = item.currentStock ?? item.weight ?? 0;
              const minimumStock = item.minimumStock ?? item.product?.minimumStock ?? 0;
              return currentStock > 0 && currentStock <= minimumStock;
            }).length
          : 0,
        outOfStockItems: Array.isArray(inventory)
          ? inventory.filter(item => (item.currentStock ?? item.weight ?? 0) === 0).length
          : 0,
        totalValue: Array.isArray(inventory)
          ? inventory.reduce((sum, item) => {
              const currentStock = item.currentStock ?? item.weight ?? 0;
              const unitPrice = getUnitPrice(item);
              return sum + (currentStock * unitPrice);
            }, 0)
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
        const currentStock = item.currentStock ?? item.weight ?? 0;
        const unitPrice = getUnitPrice(item);
        summary.warehouseBreakdown[warehouseName].items++;
        summary.warehouseBreakdown[warehouseName].value += (currentStock * unitPrice);
        const minimumStock = item.minimumStock ?? item.product?.minimumStock ?? 0;
        if (currentStock > 0 && currentStock <= minimumStock) {
          summary.warehouseBreakdown[warehouseName].lowStock++;
        }
      });

      // Normalize data for frontend expectations
      const normalized = (inventory || []).map(item => {
        try {
          const currentStock = item.currentStock ?? item.weight ?? 0;
          const minimumStock = item.minimumStock ?? item.product?.minimumStock ?? 0;
          const unitPrice = getUnitPrice(item);
          
          // Determine status
          let status = item.status;
          if (!status) {
            if (currentStock === 0) {
              status = 'Out of Stock';
            } else if (minimumStock > 0 && currentStock <= minimumStock) {
              status = 'Low Stock';
            } else {
              status = 'In Stock';
            }
          }
          
          return {
            product: { 
              name: getProductName(item),
              code: getProductCode(item) || ''
            },
          warehouse: item.warehouse ? { 
            name: item.warehouse.name || item.warehouse.location || 'Unassigned',
            code: item.warehouse.code || ''
          } : null,
            quantity: Number(currentStock) || 0,
            unit: getUnit(item),
            unitPrice: Number(unitPrice) || 0,
            reorderLevel: Number(minimumStock) || 0,
            code: getProductCode(item) || '',
            status: status
          };
        } catch (error) {
          console.error('Error normalizing inventory item:', error, item);
          // Return a minimal object to prevent crash
          return {
            product: { name: 'Error', code: '' },
            warehouse: null,
            quantity: 0,
            unit: 'units',
            unitPrice: 0,
            reorderLevel: 0,
            code: '',
            status: 'Error'
          };
        }
      });

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

      // Get sales revenue with populated items
      const sales = await Sale.find({
        saleDate: { $gte: start, $lte: end }
      })
      .populate('items.product', 'name code category')
      .populate('warehouse', 'name');

      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

      // Calculate Cost of Goods Sold (COGS) based on actual items sold
      // Fetch all purchases up to the end date (for efficiency)
      const allBagPurchases = await BagPurchase.find({
        purchaseDate: { $lte: end }
      }).sort({ purchaseDate: 1 });

      const allFoodPurchases = await FoodPurchase.find({
        purchaseDate: { $lte: end }
      }).sort({ purchaseDate: 1 });

      let totalCOGS = 0;
      const cogsBreakdown = [];

      // Helper function to calculate average purchase price for a product
      const getAveragePurchasePrice = (productName, unit, saleDate, isBagProduct) => {
        let totalQuantity = 0;
        let totalCost = 0;

        if (isBagProduct) {
          // Filter bag purchases before sale date
          const relevantPurchases = allBagPurchases.filter(p => p.purchaseDate <= saleDate);
          
          for (const purchase of relevantPurchases) {
            if (purchase.bags && purchase.bags instanceof Map) {
              purchase.bags.forEach((bagData, productType) => {
                // Match by product name similarity or exact match
                if (productType.toLowerCase().includes(productName.toLowerCase()) ||
                    productName.toLowerCase().includes(productType.toLowerCase()) ||
                    productType === productName) {
                  const qty = bagData.quantity || 0;
                  const unitPrice = bagData.unitPrice || 0;
                  if (qty > 0 && unitPrice > 0) {
                    totalQuantity += qty;
                    totalCost += (qty * unitPrice);
                  }
                }
              });
            } else if (purchase.bags && typeof purchase.bags === 'object') {
              Object.keys(purchase.bags).forEach((productType) => {
                const bagData = purchase.bags[productType];
                if (productType.toLowerCase().includes(productName.toLowerCase()) ||
                    productName.toLowerCase().includes(productType.toLowerCase()) ||
                    productType === productName) {
                  const qty = bagData.quantity || 0;
                  const unitPrice = bagData.unitPrice || 0;
                  if (qty > 0 && unitPrice > 0) {
                    totalQuantity += qty;
                    totalCost += (qty * unitPrice);
                  }
                }
              });
            }
          }
        } else {
          // Filter food purchases before sale date
          const relevantPurchases = allFoodPurchases.filter(p => p.purchaseDate <= saleDate);
          
          for (const purchase of relevantPurchases) {
            for (const foodItem of purchase.foodItems || []) {
              // Match by product name
              if (foodItem.name.toLowerCase().includes(productName.toLowerCase()) ||
                  productName.toLowerCase().includes(foodItem.name.toLowerCase()) ||
                  foodItem.name === productName) {
                const qty = foodItem.quantity || 0;
                const unitPrice = foodItem.unitPrice || 0;
                if (qty > 0 && unitPrice > 0) {
                  totalQuantity += qty;
                  totalCost += (qty * unitPrice);
                }
              }
            }
          }
        }

        return totalQuantity > 0 ? totalCost / totalQuantity : 0;
      };

      // Calculate COGS for each sale item
      for (const sale of sales) {
        for (const saleItem of sale.items || []) {
          const productName = saleItem.productName || saleItem.product?.name || '';
          const quantitySold = saleItem.quantity || 0;
          const unit = saleItem.unit || 'units';
          
          if (quantitySold <= 0) continue;

          // Determine if it's a bag product or wheat/food product
          const isBagProduct = unit.includes('bag') || unit.includes('pcs') || unit === 'units';
          const isWheatProduct = productName.toLowerCase().includes('wheat') || 
                                 saleItem.product?.category?.toLowerCase().includes('wheat') ||
                                 unit === 'kg' || unit === 'tons';

          if (isBagProduct || isWheatProduct) {
            const averagePurchasePrice = getAveragePurchasePrice(
              productName, 
              unit, 
              sale.saleDate, 
              isBagProduct
            );

            if (averagePurchasePrice > 0) {
              const itemCOGS = averagePurchasePrice * quantitySold;
              totalCOGS += itemCOGS;
              
              cogsBreakdown.push({
                productName,
                quantitySold,
                unit,
                averagePurchasePrice,
                itemCOGS
              });
            } else {
              console.warn(`No purchase found for product: ${productName} (${unit})`);
            }
          }
        }
      }

      // Get salaries (separate category)
      const salaries = await FinancialTransaction.find({
        date: { $gte: start, $lte: end },
        transactionType: 'expense',
        category: 'salaries'
      });

      const totalSalaries = salaries.reduce((sum, salary) => sum + (salary.amount || 0), 0);

      // Get expenses (excluding salaries to avoid double counting)
      const expenses = await FinancialTransaction.find({
        date: { $gte: start, $lte: end },
        transactionType: 'expense',
        category: { $ne: 'salaries' } // Exclude salaries
      });

      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

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
          bagPurchases: allBagPurchases.filter(p => p.purchaseDate >= start && p.purchaseDate <= end),
          foodPurchases: allFoodPurchases.filter(p => p.purchaseDate >= start && p.purchaseDate <= end),
          expenses,
          salaries,
          cogsBreakdown
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
        totalAmount: expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
        averageExpense: expenses.length > 0 ? expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0) / expenses.length : 0,
        categoryBreakdown: {},
        monthlyBreakdown: {}
      };

      // Group by category
      expenses.forEach(expense => {
        const cat = expense.category || 'Uncategorized';
        const amount = expense.amount || 0;
        if (!summary.categoryBreakdown[cat]) {
          summary.categoryBreakdown[cat] = { count: 0, amount: 0 };
        }
        summary.categoryBreakdown[cat].count++;
        summary.categoryBreakdown[cat].amount += amount;

        // Group by month
        if (expense.date) {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
          if (!isNaN(expenseDate.getTime())) {
            const month = expenseDate.toISOString().substring(0, 7);
            if (!summary.monthlyBreakdown[month]) {
              summary.monthlyBreakdown[month] = 0;
            }
            summary.monthlyBreakdown[month] += amount;
          }
        }
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
        totalAmount: salaries.reduce((sum, salary) => sum + (salary.amount || 0), 0),
        averageSalary: salaries.length > 0 ? salaries.reduce((sum, salary) => sum + (salary.amount || 0), 0) / salaries.length : 0,
        departmentBreakdown: {},
        monthlyBreakdown: {}
      };

      // Group by department (using user role as department)
      salaries.forEach(salary => {
        const dept = salary.createdBy?.role || 'Unknown';
        const amount = salary.amount || 0;
        if (!summary.departmentBreakdown[dept]) {
          summary.departmentBreakdown[dept] = { count: 0, amount: 0 };
        }
        summary.departmentBreakdown[dept].count++;
        summary.departmentBreakdown[dept].amount += amount;

        // Group by month
        if (salary.date) {
          const salaryDate = salary.date instanceof Date ? salary.date : new Date(salary.date);
          if (!isNaN(salaryDate.getTime())) {
            const month = salaryDate.toISOString().substring(0, 7);
            if (!summary.monthlyBreakdown[month]) {
              summary.monthlyBreakdown[month] = 0;
            }
            summary.monthlyBreakdown[month] += amount;
          }
        }
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
        // Get bag purchases (only Pending and Partial status, not Paid)
        const bagPurchases = await BagPurchase.find({
          supplier: supplier._id,
          paymentStatus: { $in: ['Pending', 'Partial'] }
        });

        // Get food purchases (only Pending and Partial status, not Completed)
        const foodPurchases = await FoodPurchase.find({
          supplier: supplier._id,
          paymentStatus: { $in: ['Pending', 'Partial'] }
        });

        const totalOutstanding = bagPurchases.reduce((sum, purchase) => sum + (purchase.dueAmount || 0), 0) +
                               foodPurchases.reduce((sum, purchase) => sum + (purchase.dueAmount || 0), 0);

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
