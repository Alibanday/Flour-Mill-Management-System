import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCalculator } from 'react-icons/fa';

const ACCOUNT_TYPE_MAPPING = {
  'Cash': { type: 'Asset', category: 'Cash' },
  'Bank': { type: 'Asset', category: 'Bank' },
  'Receivable': { type: 'Asset', category: 'Accounts Receivable' },
  'Payable': { type: 'Liability', category: 'Accounts Payable' },
  'Expenses': { type: 'Expense', category: 'Other' },
  'Others': { type: 'Asset', category: 'Other' }
};

const REVERSE_MAPPING = (type, category) => {
  if (category === 'Cash') return 'Cash';
  if (category === 'Bank') return 'Bank';
  if (category === 'Accounts Receivable') return 'Receivable';
  if (category === 'Accounts Payable') return 'Payable';
  if (type === 'Expense') return 'Expenses';
  return 'Others';
};

export default function AccountForm({ editData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    accountName: '',
    simplifiedType: 'Cash',
    description: '',
    openingBalance: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        accountName: editData.accountName || '',
        simplifiedType: REVERSE_MAPPING(editData.accountType, editData.category),
        description: editData.description || '',
        openingBalance: editData.openingBalance || 0
      });
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }
    if (formData.openingBalance < 0) {
      newErrors.openingBalance = 'Opening balance cannot be negative';
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
        ? `http://localhost:7000/api/financial/accounts/${editData._id}`
        : 'http://localhost:7000/api/financial/accounts';
      
      const method = editData ? 'PUT' : 'POST';

      // Map simplified type to backend schema
      const { type, category } = ACCOUNT_TYPE_MAPPING[formData.simplifiedType];
      
      const payload = {
        accountName: formData.accountName,
        accountType: type,
        category: category,
        description: formData.description,
        openingBalance: Number(formData.openingBalance),
        currency: 'PKR' // Fixed value as requested
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
        setErrors({ submit: errorData.message || 'Failed to save account' });
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
            <FaCalculator className="mr-2" />
            {editData ? 'Edit Account' : 'New Account'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.accountName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g. Main Cash Register"
            />
            {errors.accountName && (
              <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <select
              name="simplifiedType"
              value={formData.simplifiedType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Receivable">Receivable</option>
              <option value="Payable">Payable</option>
              <option value="Expenses">Expenses</option>
              <option value="Others">Others</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the type of account to create.
            </p>
          </div>

          {/* Opening Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Balance (PKR) *
            </label>
            <input
              type="number"
              name="openingBalance"
              value={formData.openingBalance}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.openingBalance ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {errors.openingBalance && (
              <p className="mt-1 text-sm text-red-600">{errors.openingBalance}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Account description..."
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Saving...' : (editData ? 'Update Account' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
