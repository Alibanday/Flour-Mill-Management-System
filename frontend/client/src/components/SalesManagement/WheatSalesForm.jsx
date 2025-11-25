import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShoppingCart, FaUser, FaBoxes, FaMoneyBillWave } from 'react-icons/fa';
import CustomerSearch from './CustomerSearch';

export default function WheatSalesForm({
    onSubmit,
    onCancel,
    warehouses = [],
    wheatProduct = null,
    wheatInventory = []
}) {
    const [formData, setFormData] = useState({
        customerId: '',
        customer: {
            name: '',
            contact: { phone: '', email: '', address: '' },
            creditLimit: 0,
            outstandingBalance: 0
        },
        saleDate: new Date().toISOString().split('T')[0],
        warehouse: '',
        quantity: '',
        unitPrice: wheatProduct?.price || '',
        paymentMethod: 'Cash',
        paymentStatus: 'Unpaid',
        paidAmount: 0,
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
    const [wheatStock, setWheatStock] = useState(null);

    // Update wheat stock when warehouse changes
    useEffect(() => {
        if (formData.warehouse && wheatInventory.length > 0) {
            const stock = wheatInventory.find(inv => {
                const invWarehouseId = typeof inv.warehouse === 'object' ? inv.warehouse._id : inv.warehouse;
                return invWarehouseId === formData.warehouse;
            });

            if (stock) {
                setWheatStock({
                    quantity: stock.currentStock !== undefined ? stock.currentStock : (stock.weight || 0),
                    unit: stock.unit || 'kg',
                    name: stock.name || 'Wheat'
                });
            } else {
                setWheatStock({ quantity: 0, unit: 'kg', name: 'Wheat' });
            }
        } else {
            setWheatStock(null);
        }
    }, [formData.warehouse, wheatInventory]);

    // Auto-fill unit price from wheat product
    useEffect(() => {
        if (wheatProduct && wheatProduct.price && !formData.unitPrice) {
            setFormData(prev => ({ ...prev, unitPrice: wheatProduct.price }));
        }
    }, [wheatProduct]);

    const handleCustomerSelect = (customer) => {
        if (!customer) {
            setSelectedCustomerObj(null);
            setFormData(prev => ({
                ...prev,
                customerId: '',
                customer: {
                    name: '',
                    contact: { phone: '', email: '', address: '' },
                    creditLimit: 0,
                    outstandingBalance: 0
                }
            }));
            return;
        }

        setSelectedCustomerObj(customer);
        setFormData(prev => ({
            ...prev,
            customerId: customer._id,
            customer: {
                name: `${customer.firstName} ${customer.lastName}`,
                contact: {
                    phone: customer.phone || '',
                    email: customer.email || '',
                    address: customer.address
                        ? [customer.address.street, customer.address.city, customer.address.state, customer.address.zipCode]
                            .filter(Boolean).join(', ')
                        : ''
                },
                creditLimit: customer.creditLimit || 0,
                outstandingBalance: customer.outstandingBalance || customer.creditUsed || 0
            }
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentStatusChange = (value) => {
        const total = calculateTotal();
        let paidAmount = parseFloat(formData.paidAmount) || 0;

        if (value === 'Total Paid') {
            paidAmount = total;
        } else if (value === 'Unpaid') {
            paidAmount = 0;
        }

        setFormData(prev => ({ ...prev, paymentStatus: value, paidAmount }));
    };

    const calculateTotal = () => {
        const quantity = parseFloat(formData.quantity) || 0;
        const unitPrice = parseFloat(formData.unitPrice) || 0;
        return quantity * unitPrice;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Validation
        const newErrors = {};
        if (!formData.customerId) newErrors.customer = 'Please select a customer';
        if (!formData.warehouse) newErrors.warehouse = 'Please select a warehouse';
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            newErrors.quantity = 'Please enter a valid quantity';
        }
        if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
            newErrors.unitPrice = 'Please enter a valid unit price';
        }

        // Check stock availability
        const quantity = parseFloat(formData.quantity) || 0;
        if (wheatStock && quantity > wheatStock.quantity) {
            newErrors.quantity = `Insufficient stock! Available: ${wheatStock.quantity} ${wheatStock.unit}`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        // Prepare sale data
        const saleData = {
            customerId: formData.customerId,
            customer: formData.customer,
            saleDate: formData.saleDate,
            warehouse: formData.warehouse,
            items: [{
                product: wheatProduct._id,
                productName: wheatProduct.name,
                quantity: parseFloat(formData.quantity),
                unit: wheatProduct.unit || 'kg',
                unitPrice: parseFloat(formData.unitPrice),
                totalPrice: calculateTotal()
            }],
            paymentMethod: formData.paymentMethod,
            paymentStatus: formData.paymentStatus,
            paidAmount: parseFloat(formData.paidAmount) || 0,
            discount: { type: 'none', value: 0, amount: 0 },
            tax: 0,
            notes: formData.notes
        };

        try {
            await onSubmit(saleData);
        } catch (error) {
            console.error('Error submitting wheat sale:', error);
            setErrors({ submit: error.message || 'Failed to create sale' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const total = calculateTotal();
    const dueAmount = total - (parseFloat(formData.paidAmount) || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <FaShoppingCart className="mr-2 text-green-600" />
                        New Wheat Sale
                    </h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Selection */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FaUser className="mr-2 text-blue-500" />
                            Customer Information *
                        </h3>
                        <CustomerSearch
                            onCustomerSelect={handleCustomerSelect}
                            selectedCustomer={selectedCustomerObj}
                        />
                        {errors.customer && <p className="text-red-600 text-sm mt-2">{errors.customer}</p>}
                    </div>

                    {/* Warehouse Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FaBoxes className="mr-2 text-blue-500" />
                            Select Warehouse *
                        </h3>
                        <select
                            name="warehouse"
                            value={formData.warehouse}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Choose warehouse</option>
                            {warehouses.map(warehouse => (
                                <option key={warehouse._id} value={warehouse._id}>
                                    {warehouse.name} - {warehouse.location}
                                </option>
                            ))}
                        </select>
                        {errors.warehouse && <p className="text-red-600 text-sm mt-2">{errors.warehouse}</p>}

                        {/* Wheat Stock Display */}
                        {formData.warehouse && wheatStock && (
                            <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700">Current Wheat Stock</h4>
                                        <p className="text-xs text-gray-600 mt-1">{wheatStock.name} available in this warehouse</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-green-600">
                                            {wheatStock.quantity.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-600">{wheatStock.unit}</p>
                                    </div>
                                </div>
                                {wheatStock.quantity <= 0 && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                        <p className="text-sm text-red-600">⚠️ No wheat available in this warehouse</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Wheat Sale Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FaBoxes className="mr-2 text-green-500" />
                            Wheat Sale Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Product (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                                    <p className="text-gray-900 font-medium">Wheat</p>
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity ({wheatStock?.unit || 'kg'}) *
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                    required
                                />
                                {errors.quantity && <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
                            </div>

                            {/* Unit Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit Price (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    name="unitPrice"
                                    value={formData.unitPrice}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="100"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Auto-filled from inventory</p>
                                {errors.unitPrice && <p className="text-red-600 text-xs mt-1">{errors.unitPrice}</p>}
                            </div>

                            {/* Total Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50">
                                    <p className="text-gray-900 font-bold">{total.toFixed(2)}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FaMoneyBillWave className="mr-2 text-green-500" />
                            Payment Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Credit">Credit</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
                                <select
                                    value={formData.paymentStatus}
                                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Total Paid">Total Paid</option>
                                </select>
                            </div>
                        </div>

                        {formData.paymentStatus === 'Partial' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (Rs.)</label>
                                <input
                                    type="number"
                                    name="paidAmount"
                                    value={formData.paidAmount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    max={total}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-md border border-gray-200">
                            <div>
                                <p className="text-sm text-gray-600">TOTAL AMOUNT</p>
                                <p className="text-xl font-bold text-gray-900">Rs. {total.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">AMOUNT PAID</p>
                                <p className="text-xl font-bold text-green-600">Rs. {(parseFloat(formData.paidAmount) || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">AMOUNT DUE</p>
                                <p className="text-xl font-bold text-red-600">Rs. {dueAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add any additional notes..."
                        />
                    </div>

                    {/* Error Display */}
                    {errors.submit && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                            disabled={isSubmitting}
                        >
                            <FaTimes className="mr-2" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center disabled:bg-gray-400"
                            disabled={isSubmitting}
                        >
                            <FaSave className="mr-2" />
                            {isSubmitting ? 'Creating Sale...' : 'Create Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
