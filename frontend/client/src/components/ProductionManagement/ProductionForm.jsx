import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaIndustry, FaCalculator, FaExclamationTriangle } from 'react-icons/fa';

export default function ProductionForm({ onSubmit, onCancel, editData = null, warehouses = [] }) {
  const [formData, setFormData] = useState({
    batchNumber: '',
    productName: '',
    productType: 'Finished Goods',
    productionDate: new Date().toISOString().split('T')[0],
    quantity: {
      value: '',
      unit: 'kg'
    },
    productionCost: {
      rawMaterialCost: '',
      laborCost: '',
      overheadCost: '',
      totalCost: 0,
      currency: 'PKR'
    },
    wastage: {
      quantity: 0,
      unit: 'kg',
      reason: 'Processing Loss',
      cost: 0
    },
    warehouse: '',
    quality: {
      grade: 'Standard',
      moistureContent: '',
      proteinContent: '',
      approved: false
    },
    process: {
      startTime: '',
      endTime: '',
      machineUsed: '',
      operator: ''
    },
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        productionDate: new Date(editData.productionDate).toISOString().split('T')[0],
        process: {
          ...editData.process,
          startTime: editData.process?.startTime ? new Date(editData.process.startTime).toISOString().slice(0, 16) : '',
          endTime: editData.process?.endTime ? new Date(editData.process.endTime).toISOString().slice(0, 16) : ''
        }
      });
    }
  }, [editData]);

  // Auto-calculate total cost when costs change
  useEffect(() => {
    const rawMaterial = parseFloat(formData.productionCost.rawMaterialCost) || 0;
    const labor = parseFloat(formData.productionCost.laborCost) || 0;
    const overhead = parseFloat(formData.productionCost.overheadCost) || 0;
    
    setFormData(prev => ({
      ...prev,
      productionCost: {
        ...prev.productionCost,
        totalCost: rawMaterial + labor + overhead
      }
    }));
  }, [formData.productionCost.rawMaterialCost, formData.productionCost.laborCost, formData.productionCost.overheadCost]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
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
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = 'Batch number is required';
    }

    if (!formData.productName) {
      newErrors.productName = 'Product name is required';
    }

    if (!formData.quantity.value || formData.quantity.value <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (!formData.productionCost.rawMaterialCost || formData.productionCost.rawMaterialCost <= 0) {
      newErrors.rawMaterialCost = 'Raw material cost is required';
    }

    if (!formData.productionCost.laborCost || formData.productionCost.laborCost <= 0) {
      newErrors.laborCost = 'Labor cost is required';
    }

    if (!formData.productionCost.overheadCost || formData.productionCost.overheadCost <= 0) {
      newErrors.overheadCost = 'Overhead cost is required';
    }

    if (!formData.warehouse) {
      newErrors.warehouse = 'Warehouse is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const productOptions = [
    "Wheat Flour", "Whole Wheat", "Premium Flour", "Maida", "Suji", "Fine", "Chokhar", "Refraction"
  ];

  const productTypeOptions = [
    "Raw Materials", "Finished Goods", "Repacked Product"
  ];

  const wastageReasons = [
    "Processing Loss", "Quality Issue", "Machine Error", "Human Error", "Other"
  ];

  const qualityGrades = ["Premium", "Standard", "Economy"];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaIndustry className="mr-3 text-blue-600" />
          {editData ? 'Edit Production Record' : 'Add New Production'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number *
            </label>
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.batchNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., BATCH-2024-001"
            />
            {errors.batchNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.batchNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <select
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.productName ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Product</option>
              {productOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.productName && (
              <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type *
            </label>
            <select
              name="productType"
              value={formData.productType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {productTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Production Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Production Date *
            </label>
            <input
              type="date"
              name="productionDate"
              value={formData.productionDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <div className="flex">
              <input
                type="number"
                name="quantity.value"
                value={formData.quantity.value}
                onChange={handleInputChange}
                className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              <select
                name="quantity.unit"
                value={formData.quantity.unit}
                onChange={handleInputChange}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="kg">kg</option>
                <option value="tons">tons</option>
                <option value="bags">bags</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse *
            </label>
            <select
              name="warehouse"
              value={formData.warehouse}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.warehouse ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(warehouse => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} - {warehouse.location}
                </option>
              ))}
            </select>
            {errors.warehouse && (
              <p className="text-red-500 text-sm mt-1">{errors.warehouse}</p>
            )}
          </div>
        </div>

        {/* Cost Calculation Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <FaCalculator className="mr-2" />
            Production Cost Calculation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raw Material Cost *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rs.</span>
                <input
                  type="number"
                  name="productionCost.rawMaterialCost"
                  value={formData.productionCost.rawMaterialCost}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rawMaterialCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.rawMaterialCost && (
                <p className="text-red-500 text-sm mt-1">{errors.rawMaterialCost}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labor Cost *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rs.</span>
                <input
                  type="number"
                  name="productionCost.laborCost"
                  value={formData.productionCost.laborCost}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.laborCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.laborCost && (
                <p className="text-red-500 text-sm mt-1">{errors.laborCost}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overhead Cost *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rs.</span>
                <input
                  type="number"
                  name="productionCost.overheadCost"
                  value={formData.productionCost.overheadCost}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.overheadCost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.overheadCost && (
                <p className="text-red-500 text-sm mt-1">{errors.overheadCost}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Cost
              </label>
              <div className="bg-blue-100 p-3 rounded-md">
                <span className="text-lg font-bold text-blue-800">
                  Rs. {formData.productionCost.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wastage Tracking Section */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
            <FaExclamationTriangle className="mr-2" />
            Wastage Tracking
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wastage Quantity
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="wastage.quantity"
                  value={formData.wastage.quantity}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <select
                  name="wastage.unit"
                  value={formData.wastage.unit}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="kg">kg</option>
                  <option value="tons">tons</option>
                  <option value="bags">bags</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wastage Reason
              </label>
              <select
                name="wastage.reason"
                value={formData.wastage.reason}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {wastageReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wastage Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rs.</span>
                <input
                  type="number"
                  name="wastage.cost"
                  value={formData.wastage.cost}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wastage %
              </label>
              <div className="bg-yellow-100 p-3 rounded-md">
                <span className="text-lg font-bold text-yellow-800">
                  {formData.quantity.value > 0 
                    ? ((formData.wastage.quantity / formData.quantity.value) * 100).toFixed(2)
                    : '0.00'
                  }%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Control */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Grade
            </label>
            <select
              name="quality.grade"
              value={formData.quality.grade}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {qualityGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moisture Content (%)
            </label>
            <input
              type="number"
              name="quality.moistureContent"
              value={formData.quality.moistureContent}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
              max="100"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Protein Content (%)
            </label>
            <input
              type="number"
              name="quality.proteinContent"
              value={formData.quality.proteinContent}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>

        {/* Process Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              name="process.startTime"
              value={formData.process.startTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              name="process.endTime"
              value={formData.process.endTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Machine Used
            </label>
            <input
              type="text"
              name="process.machineUsed"
              value={formData.process.machineUsed}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mill-001, Grinder-A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operator
            </label>
            <input
              type="text"
              name="process.operator"
              value={formData.process.operator}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Operator name"
            />
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about the production process..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Saving...' : (editData ? 'Update Production' : 'Save Production')}
          </button>
        </div>
      </form>
    </div>
  );
}
