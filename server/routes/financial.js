import express from "express";
import { body, validationResult } from "express-validator";
import Account from "../model/Account.js";
import Transaction from "../model/Transaction.js";
import Salary from "../model/Salary.js";
import Employee from "../model/Employee.js";
import Sale from "../model/Sale.js";
import Purchase from "../model/Purchase.js";
import BagPurchase from "../model/BagPurchase.js";
import { protect, authorize } from "../middleware/auth.js";
import { initializeDefaultAccounts } from "../utils/financialUtils.js";

const router = express.Router();

// ========================================
// ACCOUNT MANAGEMENT ROUTES (FR 26)
// ========================================

// Get all accounts
router.get("/accounts", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, accountType, category } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { accountNumber: { $regex: search, $options: 'i' } },
        { accountName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (accountType) query.accountType = accountType;
    if (category) query.category = category;
    
    const accounts = await Account.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Account.countDocuments(query);
    
    res.json({
      accounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get account by ID
router.get("/accounts/:id", protect, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new account
router.post("/accounts", protect, authorize("Admin", "Manager"), [
  body('accountName').notEmpty().withMessage('Account name is required'),
  body('accountType').isIn(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']).withMessage('Invalid account type'),
  body('category').notEmpty().withMessage('Category is required'),
  body('openingBalance').isNumeric().withMessage('Opening balance must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Auto-generate account number if not provided
    let accountNumber = req.body.accountNumber;
    if (!accountNumber) {
      const count = await Account.countDocuments();
      const categoryPrefix = (req.body.category || 'ACC').substring(0, 3).toUpperCase();
      accountNumber = `ACC-${categoryPrefix}-${String(count + 1).padStart(4, '0')}`;
      
      // Ensure uniqueness
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await Account.findOne({ accountNumber });
        if (!existing) {
          isUnique = true;
        } else {
          const newCount = await Account.countDocuments();
          accountNumber = `ACC-${categoryPrefix}-${String(newCount + 1).padStart(4, '0')}`;
          attempts++;
        }
      }
    }
    
    const account = new Account({
      ...req.body,
      accountNumber,
      status: req.body.status || 'Active', // Default to Active if not provided
      createdBy: req.user.id
    });
    
    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update account
router.put("/accounts/:id", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete account
router.delete("/accounts/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// TRANSACTION MANAGEMENT ROUTES (FR 25, 28)
// ========================================

// Get all transactions
router.get("/transactions", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, transactionType, paymentStatus, startDate, endDate } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { transactionNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (transactionType) query.transactionType = transactionType;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
      .populate('debitAccount', 'accountNumber accountName')
      .populate('creditAccount', 'accountNumber accountName')
      .populate('createdBy', 'firstName lastName')
      .sort({ transactionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction by ID
router.get("/transactions/:id", protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('debitAccount', 'accountNumber accountName')
      .populate('creditAccount', 'accountNumber accountName')
      .populate('createdBy', 'firstName lastName');
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new transaction
router.post("/transactions", protect, authorize("Admin", "Manager", "Cashier"), [
  body('transactionType').isIn(['Payment', 'Receipt', 'Purchase', 'Sale', 'Salary', 'Transfer', 'Adjustment', 'Other']).withMessage('Invalid transaction type'),
  body('description').notEmpty().withMessage('Description is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('debitAccount').notEmpty().withMessage('Debit account is required'),
  body('creditAccount').notEmpty().withMessage('Credit account is required'),
  body('paymentMethod').isIn(['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Other']).withMessage('Invalid payment method'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Generate transaction number
    const transactionCount = await Transaction.countDocuments();
    const transactionNumber = `TXN-${String(transactionCount + 1).padStart(6, '0')}`;
    
    const transaction = new Transaction({
      ...req.body,
      transactionNumber,
      createdBy: req.user.id
    });
    
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction
router.put("/transactions/:id", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete transaction
router.delete("/transactions/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// SALARY MANAGEMENT ROUTES (FR 27)
// ========================================

// Get all salaries
router.get("/salaries", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, month, year, paymentStatus } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { salaryNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const salaries = await Salary.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName email employeeId bankDetails'
      })
      .populate('processedBy', 'firstName lastName')
      .sort({ month: -1, year: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter out salaries with deleted employees
    const validSalaries = salaries.filter(salary => salary.employee !== null);
    
    
    const total = await Salary.countDocuments(query);
    
    res.json({
      salaries: validSalaries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get salary by ID
router.get("/salaries/:id", protect, async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'firstName lastName email employeeId bankDetails'
      })
      .populate('processedBy', 'firstName lastName');
    
    if (!salary) {
      return res.status(404).json({ message: "Salary not found" });
    }
    
    res.json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new salary
router.post("/salaries", protect, authorize("Admin", "Manager"), [
  body('employee').notEmpty().withMessage('Employee is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  body('basicSalary').isNumeric().withMessage('Basic salary must be a number'),
  body('workingDays').isInt({ min: 1, max: 31 }).withMessage('Working days must be between 1 and 31'),
  body('totalDays').isInt({ min: 28, max: 31 }).withMessage('Total days must be between 28 and 31'),
  body('paymentDate').notEmpty().withMessage('Payment date is required'),
  body('paymentMethod').isIn(['Cash', 'Bank Transfer', 'Cheque']).withMessage('Invalid payment method'),
  body('salaryAccount').notEmpty().withMessage('Salary account is required'),
  body('cashAccount').notEmpty().withMessage('Cash account is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if salary already exists for this employee, month, and year
    const existingSalary = await Salary.findOne({
      employee: req.body.employee,
      month: req.body.month,
      year: req.body.year
    });
    
    if (existingSalary) {
      return res.status(400).json({ message: "Salary already exists for this employee, month, and year" });
    }
    
    // Generate salary number
    const salaryCount = await Salary.countDocuments();
    const salaryNumber = `SAL-${String(salaryCount + 1).padStart(6, '0')}`;
    
    const salary = new Salary({
      ...req.body,
      salaryNumber,
      processedBy: req.user.id
    });
    
    const savedSalary = await salary.save();
    res.status(201).json(savedSalary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update salary
router.put("/salaries/:id", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!salary) {
      return res.status(404).json({ message: "Salary not found" });
    }
    
    res.json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete salary
router.delete("/salaries/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: "Salary not found" });
    }
    
    res.json({ message: "Salary deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// FINANCIAL DASHBOARD ROUTES
// ========================================

// Get financial summary
router.get("/summary", protect, async (req, res) => {
  try {
    // Account balances
    const accounts = await Account.find().select('accountType category currentBalance');
    
    // Recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ transactionDate: -1 })
      .limit(5)
      .populate('debitAccount', 'accountNumber accountName')
      .populate('creditAccount', 'accountNumber accountName');
    
    // Pending salaries
    const pendingSalaries = await Salary.find({ paymentStatus: 'Pending' })
      .populate({
        path: 'employee',
        select: 'firstName lastName bankDetails'
      })
      .sort({ month: -1, year: -1 })
      .limit(5);
    
    // Calculate totals
    const totalAssets = accounts
      .filter(acc => acc.accountType === 'Asset')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    const totalLiabilities = accounts
      .filter(acc => acc.accountType === 'Liability')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    const totalEquity = accounts
      .filter(acc => acc.accountType === 'Equity')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    const totalRevenue = accounts
      .filter(acc => acc.accountType === 'Revenue')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    const totalExpenses = accounts
      .filter(acc => acc.accountType === 'Expense')
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    res.json({
      accounts,
      recentTransactions,
      pendingSalaries,
      summary: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpenses,
        netWorth: totalAssets - totalLiabilities,
        netIncome: totalRevenue - totalExpenses
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cleanup orphaned salary records (salaries with deleted employees)
router.delete("/salaries/cleanup", protect, authorize("Admin"), async (req, res) => {
  try {
    const result = await Salary.deleteMany({ employee: null });
    res.json({
      message: `Cleaned up ${result.deletedCount} orphaned salary records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get accounts payable/receivable
router.get("/payables-receivables", protect, async (req, res) => {
  try {
    const { warehouse } = req.query;
    let query = {};
    if (warehouse) query.warehouse = warehouse;
    
    const payables = await Transaction.find({ ...query, isPayable: true, paymentStatus: 'Pending' })
      .populate('debitAccount', 'accountNumber accountName')
      .populate('creditAccount', 'accountNumber accountName')
      .sort({ dueDate: 1 });
    
    const receivables = await Transaction.find({ ...query, isReceivable: true, paymentStatus: 'Pending' })
      .populate('debitAccount', 'accountNumber accountName')
      .populate('creditAccount', 'accountNumber accountName')
      .sort({ dueDate: 1 });
    
    const totalPayables = payables.reduce((sum, t) => sum + t.amount, 0);
    const totalReceivables = receivables.reduce((sum, t) => sum + t.amount, 0);
    
    res.json({
      payables,
      receivables,
      summary: {
        totalPayables,
        totalReceivables,
        netPosition: totalReceivables - totalPayables
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize default accounts
router.post("/initialize-accounts", protect, authorize("Admin", "Manager"), async (req, res) => {
  try {
    const accounts = await initializeDefaultAccounts(req.user.id);
    res.json({
      success: true,
      message: "Default accounts initialized successfully",
      accounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enhanced financial summary with comprehensive stats
router.get("/dashboard", protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Date range query
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.transactionDate = {};
      if (startDate) dateQuery.transactionDate.$gte = new Date(startDate);
      if (endDate) dateQuery.transactionDate.$lte = new Date(endDate);
    }

    // Account balances
    const accounts = await Account.find({ status: 'Active' })
      .select('accountType category currentBalance accountName accountNumber');
    
    // Get all transactions for the period
    const transactions = await Transaction.find(dateQuery)
      .populate('debitAccount', 'accountNumber accountName category accountType')
      .populate('creditAccount', 'accountNumber accountName category accountType')
      .sort({ transactionDate: -1 });

    // Recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10);

    // Calculate Cash in Hand (sum of all Cash accounts)
    const cashAccounts = accounts.filter(acc => acc.category === 'Cash');
    const cashInHand = cashAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

    // Calculate Bank Balance (sum of all Bank accounts)
    const bankAccounts = accounts.filter(acc => acc.category === 'Bank');
    const bankBalance = bankAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

    // Calculate Accounts Receivable (sum of all AR accounts)
    const arAccounts = accounts.filter(acc => acc.category === 'Accounts Receivable');
    const totalReceivables = arAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

    // Calculate Accounts Payable (sum of all AP accounts)
    const apAccounts = accounts.filter(acc => acc.category === 'Accounts Payable');
    const totalPayables = apAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

    // Calculate Total Revenue (from Sales transactions)
    const salesTransactions = transactions.filter(t => 
      t.transactionType === 'Sale' && 
      t.creditAccount?.category === 'Sales Revenue'
    );
    const totalRevenue = salesTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate Total Expenses (from Purchase transactions)
    const purchaseTransactions = transactions.filter(t => 
      t.transactionType === 'Purchase' && 
      t.debitAccount?.category === 'Purchase Expense'
    );
    const totalExpenses = purchaseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate Net Profit/Loss
    const netProfit = totalRevenue - totalExpenses;

    // Calculate totals by account type
    const totalAssets = accounts
      .filter(acc => acc.accountType === 'Asset')
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    
    const totalLiabilities = accounts
      .filter(acc => acc.accountType === 'Liability')
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    
    const totalEquity = accounts
      .filter(acc => acc.accountType === 'Equity')
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    
    const totalRevenueAccounts = accounts
      .filter(acc => acc.accountType === 'Revenue')
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    
    const totalExpenseAccounts = accounts
      .filter(acc => acc.accountType === 'Expense')
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

    // Get unpaid sales (accounts receivable)
    const unpaidSales = await Sale.find({
      $or: [
        { paymentStatus: 'Pending' },
        { paymentStatus: 'Partial' },
        { remainingAmount: { $gt: 0 } }
      ]
    })
      .populate('customer', 'name')
      .sort({ saleDate: -1 })
      .limit(10);

    // Get unpaid purchases (accounts payable)
    const unpaidPurchases = await Purchase.find({
      $or: [
        { paymentStatus: 'Pending' },
        { paymentStatus: 'Partial' },
        { remainingAmount: { $gt: 0 } }
      ]
    })
      .populate('supplier', 'name')
      .sort({ purchaseDate: -1 })
      .limit(10);

    // Pending salaries
    const pendingSalaries = await Salary.find({ paymentStatus: 'Pending' })
      .populate({
        path: 'employee',
        select: 'firstName lastName email employeeId bankDetails'
      })
      .sort({ month: -1, year: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          cashInHand,
          bankBalance,
          totalReceivables,
          totalPayables,
          totalRevenue,
          totalExpenses,
          netProfit,
          totalAssets,
          totalLiabilities,
          totalEquity,
          totalRevenueAccounts,
          totalExpenseAccounts,
          netWorth: totalAssets - totalLiabilities,
          netIncome: totalRevenue - totalExpenses
        },
        accounts,
        recentTransactions,
        unpaidSales,
        unpaidPurchases,
        pendingSalaries,
        accountBreakdown: {
          cashAccounts: cashAccounts.map(acc => ({
            accountName: acc.accountName,
            accountNumber: acc.accountNumber,
            balance: acc.currentBalance
          })),
          bankAccounts: bankAccounts.map(acc => ({
            accountName: acc.accountName,
            accountNumber: acc.accountNumber,
            balance: acc.currentBalance
          })),
          arAccounts: arAccounts.map(acc => ({
            accountName: acc.accountName,
            accountNumber: acc.accountNumber,
            balance: acc.currentBalance
          })),
          apAccounts: apAccounts.map(acc => ({
            accountName: acc.accountName,
            accountNumber: acc.accountNumber,
            balance: acc.currentBalance
          }))
        },
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error("Error fetching financial dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching financial dashboard data",
      error: error.message
    });
  }
});

export default router;
