import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUsers, FaCalculator } from 'react-icons/fa';

export default function SalaryForm({ warehouses, accounts, editData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employee: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    workingDays: 26,
    totalDays: 30,
    overtimeHours: 0,
    overtimeRate: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    salaryAccount: '',
    cashAccount: '',
    warehouse: '',
    notes: ''
  });

  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
    if (editData) {
      setFormData({
        employee: editData.employee || '',
        month: editData.month || new Date().getMonth() + 1,
        year: editData.year || new Date().getFullYear(),
        basicSalary: editData.basicSalary || 0,
        allowances: editData.allowances || 0,
        deductions: editData.deductions || 0,
        workingDays: editData.workingDays || 26,
        totalDays: editData.totalDays || 30,
        overtimeHours: editData.overtimeHours || 0,
        overtimeRate: editData.overtimeRate || 0,
        paymentDate: editData.paymentDate ? new Date(editData.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: editData.paymentMethod || 'Cash',
        salaryAccount: editData.salaryAccount || '',
        cashAccount: editData.cashAccount || '',
        warehouse: editData.warehouse || '',
        notes: editData.notes || ''
      });
    }
  }, [editData]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/users');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
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

  const calculateNetSalary = () => {
    const basicSalary = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const overtimeAmount = (parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0);
    
    return basicSalary + allowances + overtimeAmount - deductions;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employee) {
      newErrors.employee = 'Employee is required';
    }
    if (formData.basicSalary <= 0) {
      newErrors.basicSalary = 'Basic salary must be greater than 0';
    }
    if (formData.workingDays <= 0 || formData.workingDays > 31) {
      newErrors.workingDays = 'Working days must be between 1 and 31';
    }
    if (formData.totalDays < 28 || formData.totalDays > 31) {
      newErrors.totalDays = 'Total days must be between 28 and 31';
    }
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    if (!formData.salaryAccount) {
      newErrors.salaryAccount = 'Salary account is required';
    }
    if (!formData.cashAccount) {
      newErrors.cashAccount = 'Cash account is required';
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
        ? `http://localhost:7000/api/financial/salaries/${editData._id}`
        : 'http://localhost:7000/api/financial/salaries';
      
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
        setErrors({ submit: errorData.message || 'Failed to save salary' });
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

  const netSalary = calculateNetSalary();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaUsers className="mr-2" />
            {editData ? 'Edit Salary' : 'Process Salary'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee and Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <select
                name="employee"
                value={formData.employee}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.employee ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
              {errors.employee && (
                <p className="mt-1 text-sm text-red-600">{errors.employee}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basic Salary *
              </label>
              <input
                type="number"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.basicSalary ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.basicSalary && (
                <p className="mt-1 text-sm text-red-600">{errors.basicSalary}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowances
              </label>
              <input
                type="number"
                name="allowances"
                value={formData.allowances}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deductions
              </label>
              <input
                type="number"
                name="deductions"
                value={formData.deductions}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Working Days */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days *
              </label>
              <input
                type="number"
                name="workingDays"
                value={formData.workingDays}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.workingDays ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="26"
                min="1"
                max="31"
              />
              {errors.workingDays && (
                <p className="mt-1 text-sm text-red-600">{errors.workingDays}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Days *
              </label>
              <input
                type="number"
                name="totalDays"
                value={formData.totalDays}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.totalDays ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="30"
                min="28"
                max="31"
              />
              {errors.totalDays && (
                <p className="mt-1 text-sm text-red-600">{errors.totalDays}</p>
              )}
            </div>
          </div>

          {/* Overtime */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Hours
              </label>
              <input
                type="number"
                name="overtimeHours"
                value={formData.overtimeHours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Rate
              </label>
              <input
                type="number"
                name="overtimeRate"
                value={formData.overtimeRate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Amount
              </label>
              <input
                type="text"
                value={(parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.paymentDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.paymentDate && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
              )}
            </div>

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
              </select>
            </div>
          </div>

          {/* Account Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Account *
              </label>
              <select
                name="salaryAccount"
                value={formData.salaryAccount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.salaryAccount ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Salary Account</option>
                {getAccountOptions('Expense').map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.accountName} ({account.accountNumber})
                  </option>
                ))}
              </select>
              {errors.salaryAccount && (
                <p className="mt-1 text-sm text-red-600">{errors.salaryAccount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash Account *
              </label>
              <select
                name="cashAccount"
                value={formData.cashAccount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cashAccount ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Cash Account</option>
                {getAccountOptions('Asset').map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.accountName} ({account.accountNumber})
                  </option>
                ))}
              </select>
              {errors.cashAccount && (
                <p className="mt-1 text-sm text-red-600">{errors.cashAccount}</p>
              )}
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse *
            </label>
            <select
              name="warehouse"
              value={formData.warehouse}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.warehouse ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {errors.warehouse && (
              <p className="mt-1 text-sm text-red-600">{errors.warehouse}</p>
            )}
          </div>

          {/* Net Salary Display */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-blue-900">Net Salary:</span>
              <span className="text-2xl font-bold text-blue-900">Rs. {netSalary.toFixed(2)}</span>
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Processing...' : (editData ? 'Update Salary' : 'Process Salary')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
