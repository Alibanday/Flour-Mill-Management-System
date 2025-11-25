import Account from '../model/Account.js';
import Transaction from '../model/Transaction.js';
import mongoose from 'mongoose';

/**
 * Get or create a default account by category and warehouse
 * @param {Object} params - Account parameters
 * @param {String} params.category - Account category (Cash, Bank, Accounts Receivable, etc.)
 * @param {String} params.accountType - Account type (Asset, Liability, Revenue, Expense)
 * @param {String} params.accountName - Account name
 * @param {String} params.accountNumber - Account number (optional, will be auto-generated)
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
  warehouse = null,
  createdBy,
  openingBalance = 0
}) => {
  try {
    // Build search query
    const query = {
      category,
      accountType,
      status: 'Active'
    };

    if (warehouse) {
      query.warehouse = warehouse;
    } else {
      // For global accounts, ensure warehouse is null
      query.$or = [
        { warehouse: null },
        { warehouse: { $exists: false } }
      ];
    }

    // Try to find existing account
    let account = await Account.findOne(query);

    if (!account) {
      // Generate account number if not provided
      if (!accountNumber) {
        const count = await Account.countDocuments();
        accountNumber = `ACC-${category.substring(0, 3).toUpperCase()}-${String(count + 1).padStart(4, '0')}`;
      }

      // Create new account
      account = new Account({
        accountNumber,
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
    }

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

    // Get or create Sales Revenue account
    const salesRevenueAccount = await getOrCreateAccount({
      category: 'Sales Revenue',
      accountType: 'Revenue',
      accountName: 'Sales Revenue Account',
      warehouse: null, // Global account
      createdBy
    });

    // Handle different payment scenarios
    if (sale.paymentMethod === 'Credit' || sale.remainingAmount > 0) {
      // Credit Sale - Create Accounts Receivable entry
      const accountsReceivableAccount = await getOrCreateAccount({
        category: 'Accounts Receivable',
        accountType: 'Asset',
        accountName: 'Accounts Receivable Account',
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
          accountName: sale.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Cash Account',
          warehouse: warehouse || null,
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
      // Cash Sale - Direct entry to Cash/Bank and Sales Revenue
      const cashAccount = await getOrCreateAccount({
        category: sale.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
        accountType: 'Asset',
        accountName: sale.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Cash Account',
        warehouse: warehouse || null,
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

    // Get or create Purchase Expense account
    const purchaseExpenseAccount = await getOrCreateAccount({
      category: 'Purchase Expense',
      accountType: 'Expense',
      accountName: 'Purchase Expense Account',
      warehouse: null, // Global account
      createdBy
    });

    // Handle different payment scenarios
    if (purchase.paymentMethod === 'Credit' || purchase.remainingAmount > 0) {
      // Credit Purchase - Create Accounts Payable entry
      const accountsPayableAccount = await getOrCreateAccount({
        category: 'Accounts Payable',
        accountType: 'Liability',
        accountName: 'Accounts Payable Account',
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
          accountName: purchase.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Cash Account',
          warehouse: warehouse || null,
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
      // Cash Purchase - Direct entry from Cash/Bank to Purchase Expense
      const cashAccount = await getOrCreateAccount({
        category: purchase.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
        accountType: 'Asset',
        accountName: purchase.paymentMethod === 'Bank Transfer' ? 'Main Bank Account' : 'Cash Account',
        warehouse: warehouse || null,
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
 * @param {mongoose.Types.ObjectId} createdBy - User ID who creates these accounts
 * @returns {Promise<Array>} Array of created accounts
 */
export const initializeDefaultAccounts = async (createdBy) => {
  try {
    const defaultAccounts = [
      {
        accountNumber: 'ACC-CASH-0001',
        accountName: 'Main Cash Account',
        accountType: 'Asset',
        category: 'Cash',
        description: 'Primary cash account for daily operations',
        openingBalance: 0
      },
      {
        accountNumber: 'ACC-BANK-0001',
        accountName: 'Main Bank Account',
        accountType: 'Asset',
        category: 'Bank',
        description: 'Primary bank account',
        openingBalance: 0
      },
      {
        accountNumber: 'ACC-AR-0001',
        accountName: 'Accounts Receivable Account',
        accountType: 'Asset',
        category: 'Accounts Receivable',
        description: 'Money owed to us by customers',
        openingBalance: 0
      },
      {
        accountNumber: 'ACC-AP-0001',
        accountName: 'Accounts Payable Account',
        accountType: 'Liability',
        category: 'Accounts Payable',
        description: 'Money we owe to suppliers',
        openingBalance: 0
      },
      {
        accountNumber: 'ACC-REV-0001',
        accountName: 'Sales Revenue Account',
        accountType: 'Revenue',
        category: 'Sales Revenue',
        description: 'Revenue from sales',
        openingBalance: 0
      },
      {
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
      const existingAccount = await Account.findOne({
        accountNumber: accountData.accountNumber
      });

      if (!existingAccount) {
        const account = new Account({
          ...accountData,
          currentBalance: accountData.openingBalance,
          createdBy
        });

        await account.save();
        createdAccounts.push(account);
        console.log(`✅ Created default account: ${account.accountName}`);
      } else {
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



