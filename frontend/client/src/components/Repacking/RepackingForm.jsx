import React, { useState, useEffect } from 'react';
import { useValidation } from '../../utils/validation';
import FormField from '../UI/FormField';

const RepackingForm = ({ repacking, inventory, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    repackingNumber: '',
    productType: '',
    sourceProduct: '',
    targetProduct: '',
    sourceQuantity: 0,
    targetQuantity: 0,
    wastageQuantity: 0,
    wastagePercentage: 0,
    repackingDate: new Date().toISOString().split('T')[0],
    repackedBy: '',
    supervisor: '',
    qualityCheck: {
      passed: true,
      notes: '',
      checkedBy: ''
    },
    costInfo: {
      laborCost: 0,
      materialCost: 0,
      totalCost: 0
    },
    notes: '',
    status: 'Completed'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validationSchema = {
    productType: { required: true },
    sourceProduct: { required: true },
    targetProduct: { required: true },
    sourceQuantity: { required: true, min: 0.01 },
    targetQuantity: { required: true, min: 0 },
    repackingDate: { required: true },
    repackedBy: { required: true }
  };

  const { validateField, validateForm } = useValidation(validationSchema);

  useEffect(() => {
    if (repacking) {
      setFormData({
        repackingNumber: repacking.repackingNumber || '',
        productType: repacking.productType || '',
        sourceProduct: repacking.sourceProduct || '',
        targetProduct: repacking.targetProduct || '',
        sourceQuantity: repacking.sourceQuantity || 0,
        targetQuantity: repacking.targetQuantity || 0,
        wastageQuantity: repacking.wastageQuantity || 0,
        wastagePercentage: repacking.wastagePercentage || 0,
        repackingDate: repacking.repackingDate ? repacking.repackingDate.split('T')[0] : new Date().toISOString().split('T')[0],
        repackedBy: repacking.repackedBy || '',
        supervisor: repacking.supervisor || '',
        qualityCheck: {
          passed: repacking.qualityCheck?.passed ?? true,
          notes: repacking.qualityCheck?.notes || '',
          checkedBy: repacking.qualityCheck?.checkedBy || ''
        },
        costInfo: {
          laborCost: repacking.costInfo?.laborCost || 0,
          materialCost: repacking.costInfo?.materialCost || 0,
          totalCost: repacking.costInfo?.totalCost || 0
        },
        notes: repacking.notes || '',
        status: repacking.status || 'Completed'
      });
    }
  }, [repacking]);

  useEffect(() => {
    // Calculate wastage when quantities change
    if (formData.sourceQuantity > 0) {
      const wastage = formData.sourceQuantity - formData.targetQuantity;
      const wastagePercent = (wastage / formData.sourceQuantity) * 100;
      
      setFormData(prev => ({
        ...prev,
        wastageQuantity: wastage,
        wastagePercentage: wastagePercent
      }));
    }
  }, [formData.sourceQuantity, formData.targetQuantity]);

  useEffect(() => {
    // Calculate total cost
    const totalCost = formData.costInfo.laborCost + formData.costInfo.materialCost;
    setFormData(prev => ({
      ...prev,
      costInfo: {
        ...prev.costInfo,
        totalCost: totalCost
      }
    }));
  }, [formData.costInfo.laborCost, formData.costInfo.materialCost]);

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

  const getProductOptions = (type) => {
    return inventory
      .filter(item => item.category === type)
      .map(item => ({
        value: item._id,
        label: `${item.name} (${item.quantity} ${item.unit})`
      }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {repacking ? 'Edit Repacking Record' : 'Add New Repacking Record'}
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
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Repacking Number"
                  type="text"
                  value={formData.repackingNumber}
                  onChange={(value) => handleInputChange('repackingNumber', value)}
                  placeholder="Auto-generated"
                  disabled
                />
                <FormField
                  label="Product Type"
                  type="select"
                  value={formData.productType}
                  onChange={(value) => handleInputChange('productType', value)}
                  onBlur={() => handleBlur('productType')}
                  error={errors.productType}
                  options={[
                    { value: 'Wheat', label: 'Wheat' },
                    { value: 'Flour', label: 'Flour' },
                    { value: 'Maida', label: 'Maida' },
                    { value: 'Suji', label: 'Suji' },
                    { value: 'Chokhar', label: 'Chokhar' },
                    { value: 'Fine', label: 'Fine' },
                    { value: 'Refraction', label: 'Refraction' }
                  ]}
                  required
                />
                <FormField
                  label="Repacking Date"
                  type="date"
                  value={formData.repackingDate}
                  onChange={(value) => handleInputChange('repackingDate', value)}
                  onBlur={() => handleBlur('repackingDate')}
                  error={errors.repackingDate}
                  required
                />
                <FormField
                  label="Status"
                  type="select"
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  options={[
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Quality Check', label: 'Quality Check' },
                    { value: 'Approved', label: 'Approved' }
                  ]}
                />
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Source Product"
                  type="select"
                  value={formData.sourceProduct}
                  onChange={(value) => handleInputChange('sourceProduct', value)}
                  onBlur={() => handleBlur('sourceProduct')}
                  error={errors.sourceProduct}
                  options={getProductOptions(formData.productType)}
                  required
                />
                <FormField
                  label="Target Product"
                  type="select"
                  value={formData.targetProduct}
                  onChange={(value) => handleInputChange('targetProduct', value)}
                  onBlur={() => handleBlur('targetProduct')}
                  error={errors.targetProduct}
                  options={getProductOptions(formData.productType)}
                  required
                />
                <FormField
                  label="Source Quantity"
                  type="number"
                  value={formData.sourceQuantity}
                  onChange={(value) => handleInputChange('sourceQuantity', parseFloat(value) || 0)}
                  onBlur={() => handleBlur('sourceQuantity')}
                  error={errors.sourceQuantity}
                  required
                  min="0"
                  step="0.01"
                />
                <FormField
                  label="Target Quantity"
                  type="number"
                  value={formData.targetQuantity}
                  onChange={(value) => handleInputChange('targetQuantity', parseFloat(value) || 0)}
                  onBlur={() => handleBlur('targetQuantity')}
                  error={errors.targetQuantity}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Wastage Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wastage Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Wastage Quantity"
                  type="number"
                  value={formData.wastageQuantity}
                  onChange={(value) => handleInputChange('wastageQuantity', parseFloat(value) || 0)}
                  min="0"
                  step="0.01"
                  disabled
                />
                <FormField
                  label="Wastage Percentage"
                  type="number"
                  value={formData.wastagePercentage.toFixed(2)}
                  onChange={(value) => handleInputChange('wastagePercentage', parseFloat(value) || 0)}
                  min="0"
                  max="100"
                  step="0.01"
                  disabled
                />
              </div>
            </div>

            {/* Personnel Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personnel Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Repacked By"
                  type="text"
                  value={formData.repackedBy}
                  onChange={(value) => handleInputChange('repackedBy', value)}
                  onBlur={() => handleBlur('repackedBy')}
                  error={errors.repackedBy}
                  required
                />
                <FormField
                  label="Supervisor"
                  type="text"
                  value={formData.supervisor}
                  onChange={(value) => handleInputChange('supervisor', value)}
                />
              </div>
            </div>

            {/* Quality Check */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Check</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Quality Check Passed"
                  type="select"
                  value={formData.qualityCheck.passed}
                  onChange={(value) => handleInputChange('qualityCheck.passed', value === 'true')}
                  options={[
                    { value: true, label: 'Passed' },
                    { value: false, label: 'Failed' }
                  ]}
                />
                <FormField
                  label="Checked By"
                  type="text"
                  value={formData.qualityCheck.checkedBy}
                  onChange={(value) => handleInputChange('qualityCheck.checkedBy', value)}
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Quality Check Notes"
                    type="textarea"
                    value={formData.qualityCheck.notes}
                    onChange={(value) => handleInputChange('qualityCheck.notes', value)}
                    rows={3}
                    placeholder="Quality check observations and notes"
                  />
                </div>
              </div>
            </div>

            {/* Cost Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Labor Cost (Rs.)"
                  type="number"
                  value={formData.costInfo.laborCost}
                  onChange={(value) => handleInputChange('costInfo.laborCost', parseFloat(value) || 0)}
                  min="0"
                  step="0.01"
                />
                <FormField
                  label="Material Cost (Rs.)"
                  type="number"
                  value={formData.costInfo.materialCost}
                  onChange={(value) => handleInputChange('costInfo.materialCost', parseFloat(value) || 0)}
                  min="0"
                  step="0.01"
                />
                <FormField
                  label="Total Cost (Rs.)"
                  type="number"
                  value={formData.costInfo.totalCost}
                  onChange={(value) => handleInputChange('costInfo.totalCost', parseFloat(value) || 0)}
                  min="0"
                  step="0.01"
                  disabled
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              label="Notes"
              type="textarea"
              value={formData.notes}
              onChange={(value) => handleInputChange('notes', value)}
              rows={3}
              placeholder="Additional notes about the repacking process"
            />

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
                {loading ? 'Saving...' : (repacking ? 'Update Repacking' : 'Create Repacking')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RepackingForm;

