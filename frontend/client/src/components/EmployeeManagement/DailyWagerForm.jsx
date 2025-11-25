import React, { useState } from 'react';
import { FaTimes, FaSave, FaUser, FaSpinner } from 'react-icons/fa';

export default function DailyWagerForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    cnic: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Split name
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-';

      // Generate dummy email for required field
      const dummyEmail = `dw_${formData.cnic.replace(/\D/g, '') || Date.now()}@floormill.local`;

      // Construct payload for existing API
      const payload = {
        firstName,
        lastName,
        phone: formData.phone,
        address: {
            street: formData.address || '',
            city: 'Lahore', // Default
            state: 'Punjab', // Default
            country: 'Pakistan' // Default
        },
        cnic: formData.cnic || undefined, // Make optional if not provided
        email: dummyEmail,
        department: 'Production',
        position: 'Daily Wager',
        employeeType: 'Daily Wage',
        salary: 0,
        dailyWageRate: 0, // Can be set later or assume daily payment
        hireDate: new Date().toISOString(), // Convert to ISO string format
        monthlyAllowedLeaves: 0
        // warehouse is optional - not included for daily wagers
      };

      const response = await fetch('http://localhost:7000/api/employees/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Show more detailed error message
        const errorMessage = data.errors 
          ? data.errors.map(e => e.msg || e.message).join(', ') 
          : (data.message || 'Failed to create daily wager');
        throw new Error(errorMessage);
      }

      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      console.error('Error registering daily wager:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaUser className="mr-2" />
            Register Daily Wager
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Ali Khan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0300-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNIC
            </label>
            <input
              type="text"
              name="cnic"
              required
              value={formData.cnic}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="CNIC Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              required
              rows="3"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Full residential address"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Register
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

