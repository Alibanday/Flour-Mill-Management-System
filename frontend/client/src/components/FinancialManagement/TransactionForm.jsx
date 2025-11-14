import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';

export default function TransactionForm({ accounts, editData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    transactionType: 'Payment',
    description: '',
    amount: 0,
    currency: 'PKR',
    debitAccount: '',
    creditAccount: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    isPayable: false,
    isReceivable: false,
    dueDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        transactionType: editData.transactionType || 'Payment',
        description: editData.description || '',
        amount: editData.amount || 0,
        currency: editData.currency || 'PKR',
        debitAccount: editData.debitAccount || '',
        creditAccount: editData.creditAccount || '',
        paymentMethod: editData.paymentMethod || 'Cash',
        paymentStatus: editData.paymentStatus || 'Pending',
        isPayable: editData.isPayable || false,
        isReceivable: editData.isReceivable || false,
        dueDate: editData.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : '',
        notes: editData.notes || ''
      });
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.debitAccount) {
      newErrors.debitAccount = 'Debit account is required';
    }
    if (!formData.creditAccount) {
      newErrors.creditAccount = 'Credit account is required';
    }
    if (formData.debitAccount === formData.creditAccount) {
      newErrors.creditAccount = 'Debit and credit accounts must be different';
    }
    if (!formData.warehouse) {
      newErrors.warehouse = 'Warehouse is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editData 
        ? `http://localhost:7000/api/financial/transactions/${editData._id}`
        : 'http://localhost:7000/api/financial/transactions';
      
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
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

  const getAccountOptions = (accountType) => {
    if (!accounts) return [];
    return accounts.filter(account => account.accountType === accountType);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaMoneyBillWave className="mr-2" />
            {editData ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
                <option value="Purchase">Purchase</option>
                <option value="Sale">Sale</option>
                <option value="Salary">Salary</option>
                <option value="Transfer">Transfer</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Other">Other</option>
              </select>
            </div>

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

          {/* Account Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debit Account *
              </label>
              <select
                name="debitAccount"
                value={formData.debitAccount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.debitAccount ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Debit Account</option>
                {getAccountOptions('Asset').map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.accountName} ({account.accountNumber})
                  </option>
                ))}
              </select>
              {errors.debitAccount && (
                <p className="mt-1 text-sm text-red-600">{errors.debitAccount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Account *
              </label>
              <select
                name="creditAccount"
                value={formData.creditAccount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.creditAccount ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Credit Account</option>
                {getAccountOptions('Liability').map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.accountName} ({account.accountNumber})
                  </option>
                ))}
                {getAccountOptions('Equity').map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.accountName} ({account.accountNumber})
                  </option>
                ))}
                {getAccountOptions('Revenue').map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.accountName} ({account.accountNumber})
                  </option>
                ))}
              </select>
              {errors.creditAccount && (
                <p className="mt-1 text-sm text-red-600">{errors.creditAccount}</p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
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
          </div>

          {/* Payable/Receivable Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPayable"
                checked={formData.isPayable}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Accounts Payable</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isReceivable"
                checked={formData.isReceivable}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Accounts Receivable</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
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
