import React, { useState, useEffect } from 'react';
import { useValidation } from '../../utils/validation';
import FormField from '../UI/FormField';

const CustomerForm = ({ customer, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cnic: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Pakistan'
    },
    businessInfo: {
      businessName: '',
      businessType: 'Individual',
      taxNumber: ''
    },
    creditInfo: {
      creditLimit: 0,
      creditTerms: 30,
      creditStatus: 'Active'
    },
    status: 'Active',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validationSchema = {
    firstName: { required: true, minLength: 2 },
    lastName: { required: true, minLength: 2 },
    email: { required: true, email: true },
    phone: { required: true, minLength: 10 },
    cnic: { required: true, minLength: 13 },
    'address.street': { required: true },
    'address.city': { required: true },
    'address.state': { required: true },
    'address.zipCode': { required: true },
    'creditInfo.creditLimit': { required: true, min: 0 }
  };

  const { validateField, validateForm } = useValidation(validationSchema);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        cnic: customer.cnic || '',
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          zipCode: customer.address?.zipCode || '',
          country: customer.address?.country || 'Pakistan'
        },
        businessInfo: {
          businessName: customer.businessInfo?.businessName || '',
          businessType: customer.businessInfo?.businessType || 'Individual',
          taxNumber: customer.businessInfo?.taxNumber || ''
        },
        creditInfo: {
          creditLimit: customer.creditInfo?.creditLimit || 0,
          creditTerms: customer.creditInfo?.creditTerms || 30,
          creditStatus: customer.creditInfo?.creditStatus || 'Active'
        },
        status: customer.status || 'Active',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleBlur = (field) => {
    const error = validateField(field, formData);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange('firstName', value)}
                  onBlur={() => handleBlur('firstName')}
                  error={errors.firstName}
                  required
                />
                <FormField
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange('lastName', value)}
                  onBlur={() => handleBlur('lastName')}
                  error={errors.lastName}
                  required
                />
                <FormField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  onBlur={() => handleBlur('email')}
                  error={errors.email}
                  required
                />
                <FormField
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  onBlur={() => handleBlur('phone')}
                  error={errors.phone}
                  required
                />
                <FormField
                  label="CNIC"
                  type="text"
                  value={formData.cnic}
                  onChange={(value) => handleInputChange('cnic', value)}
                  onBlur={() => handleBlur('cnic')}
                  error={errors.cnic}
                  required
                  placeholder="12345-1234567-1"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    label="Street Address"
                    type="text"
                    value={formData.address.street}
                    onChange={(value) => handleInputChange('address.street', value)}
                    onBlur={() => handleBlur('address.street')}
                    error={errors['address.street']}
                    required
                  />
                </div>
                <FormField
                  label="City"
                  type="text"
                  value={formData.address.city}
                  onChange={(value) => handleInputChange('address.city', value)}
                  onBlur={() => handleBlur('address.city')}
                  error={errors['address.city']}
                  required
                />
                <FormField
                  label="State"
                  type="text"
                  value={formData.address.state}
                  onChange={(value) => handleInputChange('address.state', value)}
                  onBlur={() => handleBlur('address.state')}
                  error={errors['address.state']}
                  required
                />
                <FormField
                  label="Zip Code"
                  type="text"
                  value={formData.address.zipCode}
                  onChange={(value) => handleInputChange('address.zipCode', value)}
                  onBlur={() => handleBlur('address.zipCode')}
                  error={errors['address.zipCode']}
                  required
                />
                <FormField
                  label="Country"
                  type="text"
                  value={formData.address.country}
                  onChange={(value) => handleInputChange('address.country', value)}
                  disabled
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Business Name"
                  type="text"
                  value={formData.businessInfo.businessName}
                  onChange={(value) => handleInputChange('businessInfo.businessName', value)}
                />
                <FormField
                  label="Business Type"
                  type="select"
                  value={formData.businessInfo.businessType}
                  onChange={(value) => handleInputChange('businessInfo.businessType', value)}
                  options={[
                    { value: 'Individual', label: 'Individual' },
                    { value: 'Retailer', label: 'Retailer' },
                    { value: 'Wholesaler', label: 'Wholesaler' },
                    { value: 'Distributor', label: 'Distributor' },
                    { value: 'Other', label: 'Other' }
                  ]}
                />
                <FormField
                  label="Tax Number"
                  type="text"
                  value={formData.businessInfo.taxNumber}
                  onChange={(value) => handleInputChange('businessInfo.taxNumber', value)}
                />
              </div>
            </div>

            {/* Credit Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Credit Limit (PKR)"
                  type="number"
                  value={formData.creditInfo.creditLimit}
                  onChange={(value) => handleInputChange('creditInfo.creditLimit', parseFloat(value) || 0)}
                  onBlur={() => handleBlur('creditInfo.creditLimit')}
                  error={errors['creditInfo.creditLimit']}
                  required
                  min="0"
                />
                <FormField
                  label="Credit Terms (Days)"
                  type="number"
                  value={formData.creditInfo.creditTerms}
                  onChange={(value) => handleInputChange('creditInfo.creditTerms', parseInt(value) || 30)}
                  min="0"
                />
                <FormField
                  label="Credit Status"
                  type="select"
                  value={formData.creditInfo.creditStatus}
                  onChange={(value) => handleInputChange('creditInfo.creditStatus', value)}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Suspended', label: 'Suspended' },
                    { value: 'Blocked', label: 'Blocked' }
                  ]}
                />
              </div>
            </div>

            {/* Status and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Status"
                type="select"
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Suspended', label: 'Suspended' }
                ]}
              />
              <FormField
                label="Notes"
                type="textarea"
                value={formData.notes}
                onChange={(value) => handleInputChange('notes', value)}
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;

