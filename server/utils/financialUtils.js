import Account from '../model/Account.js';
import Transaction from '../model/Transaction.js';
import mongoose from 'mongoose';

/**
 * Get account by account code (preferred method for default accounts)
 * @param {String} accountCode - Account code (e.g., 'MAIN_CASH', 'MAIN_BANK')
 * @returns {Promise<Object|null>} Account document or null
 */
export const getAccountByCode = async (accountCode) => {
  try {
    const account = await Account.findOne({
      accountCode,
      status: 'Active'
    });
    return account;
  } catch (error) {
    console.error('Error in getAccountByCode:', error);
    return null;
  }
};

/**
 * Get or create a default account by category and warehouse
 * Improved to prevent duplicate accounts by using account numbers and codes
 * @param {Object} params - Account parameters
 * @param {String} params.category - Account category (Cash, Bank, Accounts Receivable, etc.)
 * @param {String} params.accountType - Account type (Asset, Liability, Revenue, Expense)
 * @param {String} params.accountName - Account name
 * @param {String} params.accountNumber - Account number (optional, will be auto-generated)
 * @param {String} params.accountCode - Account code for default accounts (optional)
 * @param {mongoose.Types.ObjectId} params.warehouse - Warehouse ID (optional)
 * @param {mongoose.Types.ObjectId} params.createdBy - User ID who created it
 * @param {Number} params.openingBalance - Opening balance (default: 0)
 * @returns {Promise<Object>} Account document
 */
export const getOrCreateAccount = async ({
  category,
  accountType,
  accountName,
  accountNumber = null,
  accountCode = null,
  warehouse = null,
  createdBy,
  openingBalance = 0
}) => {
  try {
    let account = null;

    // Strategy 1: Find by account code (most reliable for default accounts)
    if (accountCode) {
      account = await Account.findOne({
        accountCode,
        status: 'Active'
      });
      if (account) {
        console.log(`✅ Found account by code: ${account.accountName} (${account.accountNumber})`);
        return account;
      }
    }

    // Strategy 2: Find by account number if provided
    if (accountNumber) {
      account = await Account.findOne({
        accountNumber,
        status: 'Active'
      });
      if (account) {
        console.log(`✅ Found account by number: ${account.accountName} (${account.accountNumber})`);
        return account;
      }
    }

    // Strategy 3: Find by category + accountType + warehouse (exact match)
    const query = {
      category,
      accountType,
      status: 'Active'
    };

    if (warehouse) {
      query.warehouse = warehouse;
    } else {
      // For global accounts, ensure warehouse is null or doesn't exist
      query.$or = [
        { warehouse: null },
        { warehouse: { $exists: false } }
      ];
    }

    account = await Account.findOne(query);

    // Strategy 4: If not found, try to find any active account with same category + type (ignore warehouse)
    // This helps reuse default accounts even if warehouse was specified incorrectly
    if (!account && !warehouse) {
      account = await Account.findOne({
        category,
        accountType,
        status: 'Active',
        warehouse: null
      });
    }

    // If account found, return it
    if (account) {
      console.log(`✅ Found existing account: ${account.accountName} (${account.accountNumber})`);
      return account;
    }

    // Strategy 5: Create new account only if truly doesn't exist
    // Generate account number if not provided
    if (!accountNumber) {
      const count = await Account.countDocuments();
      accountNumber = `ACC-${category.substring(0, 3).toUpperCase()}-${String(count + 1).padStart(4, '0')}`;
    }

    // Create new account
    account = new Account({
      accountNumber,
      accountCode: accountCode || null,
      accountName: accountName || `${category} Account`,
      accountType,
      category,
      openingBalance,
      currentBalance: openingBalance,
      warehouse: warehouse || null,
      createdBy
    });

    await account.save();
    console.log(`✅ Created new account: ${account.accountName} (${account.accountNumber})`);
    return account;
  } catch (error) {
    console.error('Error in getOrCreateAccount:', error);
    throw error;
  }
};

/**
 * Create a financial transaction (double-entry accounting)
 * @param {Object} params - Transaction parameters
 * @param {String} params.transactionType - Transaction type (Sale, Purchase, Payment, Receipt, etc.)
 * @param {mongoose.Types.ObjectId} params.debitAccount - Debit account ID
 * @param {mongoose.Types.ObjectId} params.creditAccount - Credit account ID
 * @param {Number} params.amount - Transaction amount
 * @param {String} params.description - Transaction description
 * @param {mongoose.Types.ObjectId} params.warehouse - Warehouse ID
 * @param {mongoose.Types.ObjectId} params.createdBy - User ID
 * @param {String} params.paymentMethod - Payment method (Cash, Bank Transfer, etc.)
 * @param {String} params.paymentStatus - Payment status (Completed, Pending, etc.)
 * @param {String} params.reference - Reference number (e.g., invoice number)
 * @param {mongoose.Types.ObjectId} params.relatedSale - Related sale ID (optional)
 * @param {mongoose.Types.ObjectId} params.relatedPurchase - Related purchase ID (optional)
 * @param {Boolean} params.isPayable - Is accounts payable (optional)
 * @param {Boolean} params.isReceivable - Is accounts receivable (optional)
 * @param {Date} params.dueDate - Due date (optional)
 * @returns {Promise<Object>} Transaction document
 */
export const createFinancialTransaction = async ({
  transactionType,
  debitAccount,
  creditAccount,
  amount,
  description,
  warehouse,
  createdBy,
  paymentMethod = 'Cash',
  paymentStatus = 'Completed',
  reference = '',
  relatedSale = null,
  relatedPurchase = null,
  isPayable = false,
  isReceivable = false,
  dueDate = null
}) => {
  try {
    // Generate transaction number
    const transactionCount = await Transaction.countDocuments();
    const transactionNumber = `TXN-${String(transactionCount + 1).padStart(6, '0')}`;

    // Create transaction
    const transaction = new Transaction({
      transactionNumber,
      transactionDate: new Date(),
      transactionType,
      debitAccount,
      creditAccount,
      amount,
      description,
      warehouse,
      createdBy,
      paymentMethod,
      paymentStatus,
      reference,
      relatedSale,
      relatedPurchase,
      isPayable,
      isReceivable,
      dueDate,
      currency: 'PKR'
    });

    // Save transaction (this will trigger pre-save middleware to update account balances)
    const savedTransaction = await transaction.save();
    
    console.log(`✅ Created financial transaction: ${transactionNumber} - ${description} (Rs. ${amount})`);
    
    return savedTransaction;
  } catch (error) {
    console.error('Error creating financial transaction:', error);
    throw error;
  }
};

/**
 * Create financial transaction for a Sale
 * @param {Object} params - Sale parameters
 * @returns {Promise<Object>} Transaction document(s)
 */
export const createSaleTransaction = async ({
  sale,
  warehouse,
  createdBy
}) => {
  try {
    const transactions = [];

    // Get or create Sales Revenue account (use account code for permanent account)
    const salesRevenueAccount = await getOrCreateAccount({
      category: 'Sales Revenue',
      accountType: 'Revenue',
      accountName: 'Sales Revenue Account',
      accountCode: 'SALES_REVENUE',
      accountNumber: 'ACC-REV-0001',
      warehouse: null, // Global account
      createdBy
    });

    // Handle different payment scenarios
    if (sale.paymentMethod === 'Credit' || sale.remainingAmount > 0) {
      // Credit Sale - Create Accounts Receivable entry (use account code)
      const accountsReceivableAccount = await getOrCreateAccount({
        category: 'Accounts Receivable',
        accountType: 'Asset',
        accountName: 'Accounts Receivable Account',
        accountCode: 'ACCOUNTS_RECEIVABLE',
        accountNumber: 'ACC-AR-0001',
        warehouse: null, // Global account
        createdBy
      });

      // Create receivable transaction for the total sale amount
      const receivableTransaction = await createFinancialTransaction({
        transactionType: 'Sale',
        debitAccount: accountsReceivableAccount._id,
        creditAccount: salesRevenueAccount._id,
        amount: sale.totalAmount,
        description: `Sale - Invoice ${sale.invoiceNumber} - ${sale.customer.name}`,
        warehouse,
        createdBy,
        paymentMethod: sale.paymentMethod,
        paymentStatus: 'Pending',
        reference: sale.invoiceNumber,
        relatedSale: sale._id,
        isReceivable: true,
        dueDate: sale.saleDate // Can be enhanced with payment terms
      });

      transactions.push(receivableTransaction);

      // If partial payment received, create cash/bank transaction
      if (sale.paidAmount > 0) {
        const cashAccount = await getOrCreateAccount({
          category: sale.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
          accountType: 'Asset',
          accountName: sale.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Main Cash Account',
          accountCode: sale.paymentMethod === 'Bank Transfer' ? 'MAIN_BANK' : 'MAIN_CASH',
          accountNumber: sale.paymentMethod === 'Bank Transfer' ? 'ACC-BANK-0001' : 'ACC-CASH-0001',
          warehouse: null, // Always use global cash/bank accounts
          createdBy
        });

        // Record partial payment
        const paymentTransaction = await createFinancialTransaction({
          transactionType: 'Receipt',
          debitAccount: cashAccount._id,
          creditAccount: accountsReceivableAccount._id,
          amount: sale.paidAmount,
          description: `Payment received - Invoice ${sale.invoiceNumber} - ${sale.customer.name}`,
          warehouse,
          createdBy,
          paymentMethod: sale.paymentMethod,
          paymentStatus: 'Completed',
          reference: sale.invoiceNumber,
          relatedSale: sale._id
        });

        transactions.push(paymentTransaction);
      }
    } else {
      // Cash Sale - Direct entry to Cash/Bank and Sales Revenue (use account codes)
      const cashAccount = await getOrCreateAccount({
        category: sale.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
        accountType: 'Asset',
        accountName: sale.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Main Cash Account',
        accountCode: sale.paymentMethod === 'Bank Transfer' ? 'MAIN_BANK' : 'MAIN_CASH',
        accountNumber: sale.paymentMethod === 'Bank Transfer' ? 'ACC-BANK-0001' : 'ACC-CASH-0001',
        warehouse: null, // Always use global cash/bank accounts
        createdBy
      });

      const cashTransaction = await createFinancialTransaction({
        transactionType: 'Sale',
        debitAccount: cashAccount._id,
        creditAccount: salesRevenueAccount._id,
        amount: sale.totalAmount,
        description: `Cash Sale - Invoice ${sale.invoiceNumber} - ${sale.customer.name}`,
        warehouse,
        createdBy,
        paymentMethod: sale.paymentMethod,
        paymentStatus: 'Completed',
        reference: sale.invoiceNumber,
        relatedSale: sale._id
      });

      transactions.push(cashTransaction);
    }

    return transactions;
  } catch (error) {
    console.error('Error creating sale transaction:', error);
    throw error;
  }
};

/**
 * Create financial transaction for a Purchase
 * @param {Object} params - Purchase parameters
 * @returns {Promise<Object>} Transaction document(s)
 */
export const createPurchaseTransaction = async ({
  purchase,
  warehouse,
  createdBy
}) => {
  try {
    const transactions = [];

    // Get or create Purchase Expense account (use account code)
    const purchaseExpenseAccount = await getOrCreateAccount({
      category: 'Purchase Expense',
      accountType: 'Expense',
      accountName: 'Purchase Expense Account',
      accountCode: 'PURCHASE_EXPENSE',
      accountNumber: 'ACC-EXP-0001',
      warehouse: null, // Global account
      createdBy
    });

    // Handle different payment scenarios
    if (purchase.paymentMethod === 'Credit' || purchase.remainingAmount > 0) {
      // Credit Purchase - Create Accounts Payable entry (use account code)
      const accountsPayableAccount = await getOrCreateAccount({
        category: 'Accounts Payable',
        accountType: 'Liability',
        accountName: 'Accounts Payable Account',
        accountCode: 'ACCOUNTS_PAYABLE',
        accountNumber: 'ACC-AP-0001',
        warehouse: null, // Global account
        createdBy
      });

      // Create payable transaction for the total purchase amount
      const payableTransaction = await createFinancialTransaction({
        transactionType: 'Purchase',
        debitAccount: purchaseExpenseAccount._id,
        creditAccount: accountsPayableAccount._id,
        amount: purchase.totalAmount,
        description: `Purchase - ${purchase.purchaseNumber || 'PUR-XXX'} - ${purchase.supplier.name}`,
        warehouse,
        createdBy,
        paymentMethod: purchase.paymentMethod,
        paymentStatus: 'Pending',
        reference: purchase.purchaseNumber || '',
        relatedPurchase: purchase._id,
        isPayable: true,
        dueDate: purchase.purchaseDate // Can be enhanced with payment terms
      });

      transactions.push(payableTransaction);

      // If partial payment made, create cash/bank transaction
      if (purchase.paidAmount > 0) {
        const cashAccount = await getOrCreateAccount({
          category: purchase.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
          accountType: 'Asset',
          accountName: purchase.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Main Cash Account',
          accountCode: purchase.paymentMethod === 'Bank Transfer' ? 'MAIN_BANK' : 'MAIN_CASH',
          accountNumber: purchase.paymentMethod === 'Bank Transfer' ? 'ACC-BANK-0001' : 'ACC-CASH-0001',
          warehouse: null, // Always use global cash/bank accounts
          createdBy
        });

        // Record partial payment
        const paymentTransaction = await createFinancialTransaction({
          transactionType: 'Payment',
          debitAccount: accountsPayableAccount._id,
          creditAccount: cashAccount._id,
          amount: purchase.paidAmount,
          description: `Payment made - ${purchase.purchaseNumber || 'PUR-XXX'} - ${purchase.supplier.name}`,
          warehouse,
          createdBy,
          paymentMethod: purchase.paymentMethod,
          paymentStatus: 'Completed',
          reference: purchase.purchaseNumber || '',
          relatedPurchase: purchase._id
        });

        transactions.push(paymentTransaction);
      }
    } else {
      // Cash Purchase - Direct entry from Cash/Bank to Purchase Expense (use account codes)
      const cashAccount = await getOrCreateAccount({
        category: purchase.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
        accountType: 'Asset',
        accountName: purchase.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Main Cash Account',
        accountCode: purchase.paymentMethod === 'Bank Transfer' ? 'MAIN_BANK' : 'MAIN_CASH',
        accountNumber: purchase.paymentMethod === 'Bank Transfer' ? 'ACC-BANK-0001' : 'ACC-CASH-0001',
        warehouse: null, // Always use global cash/bank accounts
        createdBy
      });

      const cashTransaction = await createFinancialTransaction({
        transactionType: 'Purchase',
        debitAccount: purchaseExpenseAccount._id,
        creditAccount: cashAccount._id,
        amount: purchase.totalAmount,
        description: `Cash Purchase - ${purchase.purchaseNumber || 'PUR-XXX'} - ${purchase.supplier.name}`,
        warehouse,
        createdBy,
        paymentMethod: purchase.paymentMethod,
        paymentStatus: 'Completed',
        reference: purchase.purchaseNumber || '',
        relatedPurchase: purchase._id
      });

      transactions.push(cashTransaction);
    }

    return transactions;
  } catch (error) {
    console.error('Error creating purchase transaction:', error);
    throw error;
  }
};

/**
 * Initialize default accounts for the system
 * Creates permanent accounts with account codes to prevent duplicates
 * @param {mongoose.Types.ObjectId} createdBy - User ID who creates these accounts
 * @returns {Promise<Array>} Array of created/found accounts
 */
export const initializeDefaultAccounts = async (createdBy) => {
  try {
    const defaultAccounts = [
      {
        accountCode: 'MAIN_CASH',
        accountNumber: 'ACC-CASH-0001',
        accountName: 'Main Cash Account',
        accountType: 'Asset',
        category: 'Cash',
        description: 'Primary cash account for daily operations',
        openingBalance: 0
      },
      {
        accountCode: 'MAIN_BANK',
        accountNumber: 'ACC-BANK-0001',
        accountName: 'Main Bank Account',
        accountType: 'Asset',
        category: 'Bank',
        description: 'Primary bank account',
        openingBalance: 0
      },
      {
        accountCode: 'ACCOUNTS_RECEIVABLE',
        accountNumber: 'ACC-AR-0001',
        accountName: 'Accounts Receivable Account',
        accountType: 'Asset',
        category: 'Accounts Receivable',
        description: 'Money owed to us by customers',
        openingBalance: 0
      },
      {
        accountCode: 'ACCOUNTS_PAYABLE',
        accountNumber: 'ACC-AP-0001',
        accountName: 'Accounts Payable Account',
        accountType: 'Liability',
        category: 'Accounts Payable',
        description: 'Money we owe to suppliers',
        openingBalance: 0
      },
      {
        accountCode: 'SALES_REVENUE',
        accountNumber: 'ACC-REV-0001',
        accountName: 'Sales Revenue Account',
        accountType: 'Revenue',
        category: 'Sales Revenue',
        description: 'Revenue from sales',
        openingBalance: 0
      },
      {
        accountCode: 'PURCHASE_EXPENSE',
        accountNumber: 'ACC-EXP-0001',
        accountName: 'Purchase Expense Account',
        accountType: 'Expense',
        category: 'Purchase Expense',
        description: 'Expenses from purchases',
        openingBalance: 0
      }
    ];

    const createdAccounts = [];

    for (const accountData of defaultAccounts) {
      // First check by account code
      let existingAccount = await Account.findOne({
        accountCode: accountData.accountCode,
        status: 'Active'
      });

      // If not found by code, check by account number
      if (!existingAccount) {
        existingAccount = await Account.findOne({
          accountNumber: accountData.accountNumber
        });
      }

      if (!existingAccount) {
        // Create new account
        const account = new Account({
          ...accountData,
          currentBalance: accountData.openingBalance,
          warehouse: null, // Default accounts are global
          createdBy
        });

        await account.save();
        createdAccounts.push(account);
        console.log(`✅ Created default account: ${account.accountName} (${account.accountCode})`);
      } else {
        // Update existing account to have account code if missing
        if (!existingAccount.accountCode && accountData.accountCode) {
          existingAccount.accountCode = accountData.accountCode;
          await existingAccount.save();
          console.log(`✅ Updated account with code: ${existingAccount.accountName} -> ${accountData.accountCode}`);
        }
        createdAccounts.push(existingAccount);
        console.log(`ℹ️  Default account already exists: ${accountData.accountName}`);
      }
    }

    return createdAccounts;
  } catch (error) {
    console.error('Error initializing default accounts:', error);
    throw error;
  }
};



