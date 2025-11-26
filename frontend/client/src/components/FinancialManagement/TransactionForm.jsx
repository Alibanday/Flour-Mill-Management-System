import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';

export default function TransactionForm({ accounts, editData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    transactionType: 'Payment', // Fixed for expenses
    description: '',
    amount: 0,
    expenseAccount: '', // Expense account (will be debit account)
    transactionDate: new Date().toISOString().split('T')[0], // Current date
    paymentMethod: 'Cash',
    paymentStatus: 'Completed',
    warehouse: '' // Warehouse (required by model)
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  useEffect(() => {
    fetchWarehouses();
    if (editData) {
      setFormData({
        transactionType: 'Payment',
        description: editData.description || '',
        amount: editData.amount || 0,
        expenseAccount: editData.debitAccount?._id || editData.debitAccount || '',
        transactionDate: editData.transactionDate ? new Date(editData.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: editData.paymentMethod || 'Cash',
        paymentStatus: editData.paymentStatus || 'Completed',
        warehouse: editData.warehouse?._id || editData.warehouse || ''
      });
    }
  }, [editData]);

  const fetchWarehouses = async () => {
    try {
      setWarehousesLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:7000/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const warehousesList = data.data || [];
        setWarehouses(warehousesList);
        // Auto-select first warehouse if not editing and warehouses are available
        if (!editData && warehousesList.length > 0) {
          setFormData(prev => ({ ...prev, warehouse: warehousesList[0]._id }));
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Get expense accounts
  const expenseAccounts = accounts ? accounts.filter(acc => acc.accountType === 'Expense') : [];
  
  // Get Cash or Bank account based on payment method
  const getPaymentAccount = () => {
    if (!accounts) return null;
    if (formData.paymentMethod === 'Cash') {
      // Find Cash account
      return accounts.find(acc => acc.category === 'Cash' && acc.accountType === 'Asset');
    } else if (formData.paymentMethod === 'Bank Transfer') {
      // Find Bank account
      return accounts.find(acc => acc.category === 'Bank' && acc.accountType === 'Asset');
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.expenseAccount) {
      newErrors.expenseAccount = 'Expense account is required';
    }
    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Date is required';
    }
    if (!getPaymentAccount()) {
      newErrors.paymentMethod = `No ${formData.paymentMethod === 'Cash' ? 'Cash' : 'Bank'} account found. Please create one first.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const paymentAccount = getPaymentAccount();
      if (!paymentAccount) {
        setErrors({ submit: `No ${formData.paymentMethod === 'Cash' ? 'Cash' : 'Bank'} account found. Please create one first.` });
        setIsSubmitting(false);
        return;
      }

      const url = editData 
        ? `http://localhost:7000/api/financial/transactions/${editData._id}`
        : 'http://localhost:7000/api/financial/transactions';
      
      const method = editData ? 'PUT' : 'POST';
      
      // For expense transactions:
      // Debit Account: Expense Account (money going out as expense)
      // Credit Account: Cash or Bank Account (money coming from)
      // Auto-select first warehouse if not set
      let warehouseId = formData.warehouse;
      if (!warehouseId && warehouses.length > 0) {
        warehouseId = warehouses[0]._id;
      }
      if (!warehouseId) {
        setErrors({ submit: 'No warehouse available. Please create a warehouse first.' });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        transactionType: 'Payment',
        description: formData.description,
        amount: Number(formData.amount),
        transactionDate: new Date(formData.transactionDate).toISOString(),
        debitAccount: formData.expenseAccount, // Expense account
        creditAccount: paymentAccount._id, // Cash or Bank account
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        currency: 'PKR',
        warehouse: warehouseId
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSubmit();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to save transaction' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaMoneyBillWave className="mr-2" />
            {editData ? 'Edit Expense Transaction' : 'New Expense Transaction'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type - Fixed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <input
              type="text"
              value="Expense"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Expense Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Account *
            </label>
            <select
              name="expenseAccount"
              value={formData.expenseAccount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.expenseAccount ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Expense Account</option>
              {expenseAccounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.accountName} ({account.accountNumber})
                </option>
              ))}
            </select>
            {errors.expenseAccount && (
              <p className="mt-1 text-sm text-red-600">{errors.expenseAccount}</p>
            )}
            {expenseAccounts.length === 0 && (
              <p className="mt-1 text-sm text-yellow-600">No expense accounts found. Please create one first.</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.transactionDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.transactionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.transactionDate}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Transaction description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status *
            </label>
            <select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Saving...' : (editData ? 'Update Transaction' : 'Create Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
