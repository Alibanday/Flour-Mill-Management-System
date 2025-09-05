import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaUser, FaTruck, FaBoxes, FaTools, FaUserTie,
  FaPrint, FaWhatsapp, FaEye, FaDownload, FaCalendarAlt, FaMapMarkerAlt
} from 'react-icons/fa';

export default function GatePassForm({ gatePass, warehouses, onClose, user }) {
  const [formData, setFormData] = useState({
    type: 'Person',
    purpose: '',
    issuedTo: {
      name: '',
      contact: '',
      idNumber: '',
      company: '',
    },
    items: [{ description: '', quantity: 1, unit: 'Piece', value: 0 }],
    vehicle: {
      number: '',
      type: '',
      driver: '',
    },
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    warehouse: '',
    notes: '',
    printOptions: {
      gatePass: true,
      invoice: false,
      both: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const isEditing = !!gatePass;

  useEffect(() => {
    if (gatePass) {
      setFormData({
        type: gatePass.type || 'Person',
        purpose: gatePass.purpose || '',
        issuedTo: {
          name: gatePass.issuedTo?.name || '',
          contact: gatePass.issuedTo?.contact || '',
          idNumber: gatePass.issuedTo?.idNumber || '',
          company: gatePass.issuedTo?.company || '',
        },
        items: gatePass.items?.length > 0 ? gatePass.items : [{ description: '', quantity: 1, unit: 'Piece', value: 0 }],
        vehicle: {
          number: gatePass.vehicle?.number || '',
          type: gatePass.vehicle?.type || '',
          driver: gatePass.vehicle?.driver || '',
        },
        validFrom: gatePass.validFrom ? new Date(gatePass.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validUntil: gatePass.validUntil ? new Date(gatePass.validUntil).toISOString().split('T')[0] : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        warehouse: gatePass.warehouse?._id || gatePass.warehouse || '',
        notes: gatePass.notes || '',
        printOptions: gatePass.printOptions || {
          gatePass: true,
          invoice: false,
          both: false,
        },
      });
    }
  }, [gatePass]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('issuedTo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        issuedTo: {
          ...prev.issuedTo,
          [field]: value,
        },
      }));
    } else if (name.startsWith('vehicle.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [field]: value,
        },
      }));
    } else if (name.startsWith('printOptions.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        printOptions: {
          ...prev.printOptions,
          [field]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit: 'Piece', value: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const url = isEditing 
        ? `http://localhost:7000/api/gate-pass/${gatePass._id}`
        : 'http://localhost:7000/api/gate-pass';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save gate pass');
      }

      const data = await response.json();
      
      // Show success message
      alert(isEditing ? 'Gate pass updated successfully!' : 'Gate pass created successfully!');
      
      // Close form
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // This will be implemented to show print options
    setShowPreview(true);
  };

  const handleWhatsAppShare = () => {
    // This will be implemented to share via WhatsApp
    const message = `Gate Pass: ${formData.type}\nPurpose: ${formData.purpose}\nIssued To: ${formData.issuedTo.name}\nValid Until: ${formData.validUntil}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Person': return <FaUser className="h-4 w-4" />;
      case 'Vehicle': return <FaTruck className="h-4 w-4" />;
      case 'Material': return <FaBoxes className="h-4 w-4" />;
      case 'Equipment': return <FaTools className="h-4 w-4" />;
      case 'Visitor': return <FaUserTie className="h-4 w-4" />;
      default: return <FaUser className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Edit Gate Pass" : "Create New Gate Pass"}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              title="Print/Preview"
            >
              <FaPrint className="mr-2" />
              Preview
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
              title="Share via WhatsApp"
            >
              <FaWhatsapp className="mr-2" />
              WhatsApp
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-red-600">Error: {error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Person">Person</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Material">Material</option>
                <option value="Equipment">Equipment</option>
                <option value="Visitor">Visitor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter purpose"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
              <select 
                name="warehouse"
                value={formData.warehouse}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issued To Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              {getTypeIcon(formData.type)}
              <span className="ml-2">Issued To Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="issuedTo.name"
                  value={formData.issuedTo.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                <input
                  type="text"
                  name="issuedTo.contact"
                  value={formData.issuedTo.contact}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input
                  type="text"
                  name="issuedTo.idNumber"
                  value={formData.issuedTo.idNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter ID number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  name="issuedTo.company"
                  value={formData.issuedTo.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information (if type is Vehicle) */}
          {formData.type === 'Vehicle' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FaTruck className="mr-2" />
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicle.number"
                    value={formData.vehicle.number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter vehicle number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    name="vehicle.type"
                    value={formData.vehicle.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter vehicle type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    name="vehicle.driver"
                    value={formData.vehicle.driver}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter driver name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <FaBoxes className="mr-2" />
                Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Piece">Piece</option>
                      <option value="Kg">Kg</option>
                      <option value="Liter">Liter</option>
                      <option value="Box">Box</option>
                      <option value="Bag">Bag</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) => handleItemChange(index, 'value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Print Options */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FaPrint className="mr-2" />
              Print Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="printOptions.gatePass"
                  checked={formData.printOptions.gatePass}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Gate Pass</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="printOptions.invoice"
                  checked={formData.printOptions.invoice}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Invoice</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="printOptions.both"
                  checked={formData.printOptions.both}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Both</label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {isEditing ? "Update" : "Create"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Gate Pass Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">GATE PASS</h3>
                <p className="text-gray-600">FlourMill Pro System</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p><strong>Type:</strong> {formData.type}</p>
                  <p><strong>Purpose:</strong> {formData.purpose}</p>
                  <p><strong>Issued To:</strong> {formData.issuedTo.name}</p>
                  <p><strong>Contact:</strong> {formData.issuedTo.contact}</p>
                </div>
                <div>
                  <p><strong>Valid From:</strong> {formData.validFrom}</p>
                  <p><strong>Valid Until:</strong> {formData.validUntil}</p>
                  <p><strong>Warehouse:</strong> {warehouses.find(w => w._id === formData.warehouse)?.name}</p>
                </div>
              </div>
              
              {formData.items.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <div className="space-y-1">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.description} - {item.quantity} {item.unit}</span>
                        <span>Rs. {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaPrint className="mr-2" />
                Print
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
              >
                <FaWhatsapp className="mr-2" />
                Share via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
