import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShoppingCart, FaCalculator, FaUser, FaBoxes, FaUndo, FaPercent, FaRupeeSign, FaPlus, FaSearch, FaUserPlus, FaMoneyBillWave, FaPrint } from 'react-icons/fa';
import CustomerSearch from './CustomerSearch';
import api, { API_ENDPOINTS } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SalesFormEnhanced({ onSubmit, onCancel, editData = null, warehouses = [], products = [] }) {
  const [formData, setFormData] = useState({
    invoiceNumber: '', // Will be auto-generated
    customerId: '', // New field for customer reference
    customer: {
      name: '',
      contact: {
        phone: '',
        email: '',
        address: ''
      },
      creditLimit: 0,
      outstandingBalance: 0
    },
    saleDate: new Date().toISOString().split('T')[0],
    items: [],
    warehouse: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    discount: {
      type: 'none',
      value: 0,
      amount: 0
    },
    tax: 0,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState('');
  const [showReturns, setShowReturns] = useState(false);
  const [returns, setReturns] = useState([]);
  const [inventoryStock, setInventoryStock] = useState({}); // Store inventory stock by product ID
  const [availableStock, setAvailableStock] = useState(0); // Available stock for selected product

  // Customer search states (keeping for backward compatibility)
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);

  // Helper function for safe number parsing
  const safeNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Fetch inventory stock for selected warehouse
  useEffect(() => {
    const fetchInventoryStock = async () => {
      if (!formData.warehouse) {
        setInventoryStock({});
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7000/api/inventory?warehouse=${formData.warehouse}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Create a map of product ID to inventory stock
            const stockMap = {};
            data.data.forEach(item => {
              // Handle both new structure (product reference) and legacy (direct product data)
              const productId = item.product?._id || item.product || item._id;
              const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
              stockMap[productId] = stock;
            });
            setInventoryStock(stockMap);
          }
        }
      } catch (error) {
        console.error('Error fetching inventory stock:', error);
      }
    };

    fetchInventoryStock();
  }, [formData.warehouse]);

  // Update available stock when product or warehouse changes
  useEffect(() => {
    if (selectedProduct && formData.warehouse) {
      const stock = inventoryStock[selectedProduct] || 0;
      setAvailableStock(stock);
    } else {
      setAvailableStock(0);
    }
  }, [selectedProduct, formData.warehouse, inventoryStock]);

  // Auto-fill unit price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p._id === selectedProduct);
      if (product && product.price) {
        setItemUnitPrice(product.price);
      }
    }
  }, [selectedProduct, products]);

  // Auto-calculate total price for each item
  useEffect(() => {
    if (itemQuantity && itemUnitPrice) {
      const quantity = safeNumber(itemQuantity);
      const unitPrice = safeNumber(itemUnitPrice);
      const totalPrice = quantity * unitPrice;

      // You can optionally store this in a state if needed for display
      // For now, we'll calculate it when adding the item
    }
  }, [itemQuantity, itemUnitPrice]);

  useEffect(() => {
    if (editData) {
      console.log('📝 Loading edit data:', editData);

      // Extract customer ID - handle both customerId and customer.customerId
      const customerId = editData.customerId || editData.customer?.customerId || editData.customer?._id;

      // Extract warehouse ID - handle both string and object
      const warehouseId = typeof editData.warehouse === 'object'
        ? editData.warehouse._id || editData.warehouse
        : editData.warehouse;

      // Map payment status from backend to frontend
      let paymentStatus = editData.paymentStatus || 'Unpaid';
      if (paymentStatus === 'Pending') paymentStatus = 'Unpaid';
      if (paymentStatus === 'Paid') paymentStatus = 'Total Paid';

      // Extract paid amount
      const paidAmount = parseFloat(editData.paidAmount) || 0;

      // Extract customer data
      const customerData = editData.customer || {};

      // Format sale date
      const saleDate = editData.saleDate
        ? new Date(editData.saleDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // Extract items - ensure product field is an ID string, not an object
      const items = (editData.items || []).map(item => ({
        ...item,
        product: typeof item.product === 'object' && item.product?._id
          ? item.product._id
          : item.product
      }));

      // Extract discount
      const discount = editData.discount || { type: 'none', value: 0, amount: 0 };

      // Extract tax
      const tax = parseFloat(editData.tax) || 0;

      // Set form data
      setFormData({
        invoiceNumber: editData.invoiceNumber || '',
        customerId: customerId || '',
        customer: {
          name: customerData.name || '',
          contact: {
            phone: customerData.contact?.phone || '',
            email: customerData.contact?.email || '',
            address: customerData.contact?.address || ''
          },
          creditLimit: customerData.creditLimit || 0,
          outstandingBalance: customerData.outstandingBalance || customerData.creditUsed || 0
        },
        saleDate: saleDate,
        items: items,
        warehouse: warehouseId || '',
        paymentMethod: editData.paymentMethod || 'Cash',
        paymentStatus: paymentStatus,
        paidAmount: paidAmount,
        discount: discount,
        tax: tax,
        notes: editData.notes || ''
      });

      // Set returns if they exist
      if (editData.returns) {
        setReturns(editData.returns);
      }

      // If editing and customer ID exists, always fetch the full customer object
      // This ensures we have firstName/lastName for CustomerSearch component
      if (customerId) {
        console.log('👤 Fetching customer by ID for edit:', customerId);
        fetchCustomerById(customerId);
      }

      console.log('✅ Form data loaded:', {
        customerId,
        warehouseId,
        paymentStatus,
        paidAmount,
        itemsCount: items.length,
        totalAmount: editData.totalAmount,
        customerName: customerData.name
      });
    } else {
      // Reset form when not editing
      setFormData({
        invoiceNumber: '',
        customerId: '',
        customer: {
          name: '',
          contact: {
            phone: '',
            email: '',
            address: ''
          },
          creditLimit: 0,
          outstandingBalance: 0
        },
        saleDate: new Date().toISOString().split('T')[0],
        items: [],
        warehouse: '',
        paymentMethod: 'Cash',
        paymentStatus: 'Unpaid',
        paidAmount: 0,
        discount: {
          type: 'none',
          value: 0,
          amount: 0
        },
        tax: 0,
        notes: ''
      });
      setSelectedCustomerObj(null);
      setReturns([]);
    }
  }, [editData]);

  const fetchCustomerById = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const customer = data.data;
          setSelectedCustomerObj(customer);

          // Update form data with customer information
          setFormData(prev => ({
            ...prev,
            customerId: customer._id,
            customer: {
              name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.customerName || '',
              contact: {
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address
                  ? [
                    customer.address.street,
                    customer.address.city,
                    customer.address.state,
                    customer.address.zipCode
                  ].filter(Boolean).join(', ')
                  : ''
              },
              creditLimit: customer.creditLimit || 0,
              outstandingBalance: customer.creditUsed || customer.outstandingBalance || 0
            }
          }));

          console.log('✅ Customer loaded:', customer);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching customer:', error);
    }
  };

  // Auto-calculate discount amount when discount changes
  useEffect(() => {
    if (formData.discount?.type === 'percentage') {
      const subtotal = (formData.items || []).reduce((sum, item) => sum + safeNumber(item.totalPrice), 0);
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: (subtotal * safeNumber(prev.discount?.value)) / 100
        }
      }));
    } else if (formData.discount?.type === 'fixed') {
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: safeNumber(prev.discount?.value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: 0
        }
      }));
    }
  }, [formData.discount?.type, formData.discount?.value, formData.items]);

  const handleCustomerSelect = (customer) => {
    if (!customer) {
      // Clear customer data when no customer is selected
      setSelectedCustomerObj(null);
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customer: {
          name: '',
          contact: {
            phone: '',
            email: '',
            address: ''
          },
          creditLimit: 0,
          outstandingBalance: 0
        }
      }));
      return;
    }

    // Store the full customer object
    setSelectedCustomerObj(customer);

    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      customer: {
        name: `${customer.firstName} ${customer.lastName}`,
        contact: {
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address ?
            [
              customer.address.street,
              customer.address.city,
              customer.address.state,
              customer.address.zipCode
            ].filter(Boolean).join(', ') : ''
        },
        creditLimit: customer.creditLimit || 0,
        outstandingBalance: customer.outstandingBalance || customer.creditUsed || 0
      }
    }));

    console.log('✅ Customer selected:', {
      customerId: customer._id,
      name: `${customer.firstName} ${customer.lastName}`,
      creditLimit: customer.creditLimit,
      outstandingBalance: customer.outstandingBalance || customer.creditUsed,
      rawCustomer: customer
    });
  };

  const clearCustomer = () => {
    setSelectedCustomerObj(null);
    setFormData(prev => ({
      ...prev,
      customerId: '',
      customer: {
        name: '',
        contact: {
          phone: '',
          email: '',
          address: ''
        },
        creditLimit: 0,
        outstandingBalance: 0
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;


    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;

        // Navigate to the nested property
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }

        // Set the final value
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePaymentStatusChange = (value) => {
    const total = calculateTotal();
    setFormData(prev => {
      let paidAmount = safeNumber(prev.paidAmount);

      if (value === 'Total Paid') {
        paidAmount = total;
      } else if (value === 'Unpaid') {
        paidAmount = 0;
      } else if (value === 'Partial') {
        paidAmount = Math.min(paidAmount > 0 ? paidAmount : 0, total);
      }

      return {
        ...prev,
        paymentStatus: value,
        paidAmount
      };
    });
  };

  const addItem = () => {
    if (!formData.warehouse) {
      setErrors({ items: 'Please select a warehouse first' });
      return;
    }

    if (!selectedProduct || !itemQuantity || !itemUnitPrice) {
      setErrors({ items: 'Please fill all item fields' });
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    if (!product) {
      setErrors({ items: 'Product not found' });
      return;
    }

    // Check stock availability from inventory
    const quantity = safeNumber(itemQuantity);
    const stock = availableStock || 0;
    if (stock < quantity) {
      setErrors({ items: `Insufficient stock! Available: ${stock} ${product.unit || 'units'}, Requested: ${quantity}` });
      return;
    }

    const unitPrice = safeNumber(itemUnitPrice);
    const totalPrice = quantity * unitPrice;

    const newItem = {
      product: selectedProduct, // Product ID from catalog
      productName: product.name,
      quantity: quantity,
      unit: product.unit || 'units',
      unitPrice: unitPrice,
      totalPrice: totalPrice
    };

    const updatedItems = [...formData.items, newItem];
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Check credit limit if payment method is credit
    if (formData.paymentMethod === 'Credit' && formData.customerId) {
      const availableCredit = formData.customer.creditLimit - formData.customer.outstandingBalance;
      if (newSubtotal > availableCredit) {
        setErrors({ items: `Credit limit exceeded! Available credit: Rs. ${availableCredit.toFixed(2)}, Purchase total: Rs. ${newSubtotal.toFixed(2)}` });
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset item fields
    setSelectedProduct('');
    setItemQuantity('');
    setItemUnitPrice('');
    setErrors({});
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + safeNumber(item.totalPrice), 0);
    const discountAmount = safeNumber(formData.discount?.amount || 0);
    const taxAmount = safeNumber(formData.tax || 0);
    return subtotal - discountAmount + taxAmount;
  };

  // Print Invoice
  const printInvoice = (saleData) => {
    try {
      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(20);
      doc.text('FLOUR MILL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text('SALES INVOICE', 105, 30, { align: 'center' });

      // Invoice Details
      doc.setFontSize(10);
      doc.text(`Invoice #: ${saleData.invoiceNumber || 'AUTO-GENERATED'}`, 20, 45);
      doc.text(`Date: ${saleData.saleDate ? new Date(saleData.saleDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, 52);

      // Customer Details
      doc.setFontSize(12);
      doc.text('Bill To:', 20, 65);
      doc.setFontSize(10);
      doc.text(saleData.customer?.name || 'N/A', 20, 72);
      if (saleData.customer?.contact?.phone) {
        doc.text(`Phone: ${saleData.customer.contact.phone}`, 20, 79);
      }
      if (saleData.customer?.contact?.address) {
        doc.text(`Address: ${saleData.customer.contact.address}`, 20, 86);
      }

      // Items Table - Try autoTable first, fallback to manual
      let finalY = 95;
      if (saleData.items && Array.isArray(saleData.items) && saleData.items.length > 0) {
        try {
          // Try to use autoTable if available
          if (typeof doc.autoTable === 'function') {
            const itemsData = saleData.items.map(item => [
              (item.productName || item.name || 'N/A').toString().substring(0, 30), // Limit length
              (item.quantity || 0).toString(),
              (item.unit || 'units').toString(),
              `Rs. ${(parseFloat(item.unitPrice) || 0).toFixed(2)}`,
              `Rs. ${(parseFloat(item.totalPrice) || 0).toFixed(2)}`
            ]);

            doc.autoTable({
              startY: 95,
              head: [['Product', 'Qty', 'Unit', 'Unit Price', 'Total']],
              body: itemsData,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [66, 139, 202] }
            });

            finalY = doc.lastAutoTable.finalY + 10;
          } else {
            throw new Error('autoTable not available');
          }
        } catch (autoTableError) {
          // Fallback: Manual table creation
          console.warn('autoTable not available, using manual table:', autoTableError);
          doc.setFontSize(10);
          doc.text('Items:', 20, finalY);
          finalY += 10;
          (saleData.items || []).forEach((item, index) => {
            if (finalY > 250) {
              doc.addPage();
              finalY = 20;
            }
            const itemText = `${index + 1}. ${item.productName || item.name || 'N/A'} - Qty: ${item.quantity || 0} ${item.unit || 'units'} - Price: Rs. ${(parseFloat(item.totalPrice) || 0).toFixed(2)}`;
            doc.text(itemText, 20, finalY);
            finalY += 7;
          });
          finalY += 5;
        }
      } else {
        // No items - just show message
        doc.setFontSize(10);
        doc.text('No items in this sale.', 20, finalY);
        finalY += 10;
      }

      // Totals
      doc.setFontSize(10);
      doc.text(`Subtotal: Rs. ${(saleData.subtotal || 0).toFixed(2)}`, 150, finalY, { align: 'right' });
      const discountAmount = saleData.discount?.amount || (typeof saleData.discount === 'number' ? saleData.discount : 0);
      if (discountAmount > 0) {
        doc.text(`Discount: Rs. ${discountAmount.toFixed(2)}`, 150, finalY + 7, { align: 'right' });
      }
      if (saleData.tax > 0) {
        doc.text(`Tax: Rs. ${(saleData.tax || 0).toFixed(2)}`, 150, finalY + 14, { align: 'right' });
      }
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total: Rs. ${(saleData.totalAmount || 0).toFixed(2)}`, 150, finalY + 21, { align: 'right' });

      // Payment Info
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Payment Method: ${saleData.paymentMethod || 'N/A'}`, 20, finalY + 30);
      doc.text(`Payment Status: ${saleData.paymentStatus || 'N/A'}`, 20, finalY + 37);
      if (saleData.paidAmount > 0) {
        doc.text(`Paid Amount: Rs. ${(saleData.paidAmount || 0).toFixed(2)}`, 20, finalY + 44);
      }
      if (saleData.dueAmount > 0) {
        doc.text(`Due Amount: Rs. ${(saleData.dueAmount || 0).toFixed(2)}`, 20, finalY + 51);
      }

      // Footer
      doc.setFontSize(8);
      doc.text('Thank you for your business!', 105, 280, { align: 'center' });

      doc.save(`Invoice-${saleData.invoiceNumber || 'AUTO'}.pdf`);
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error generating invoice PDF: ' + error.message);
    }
  };

  // Print Gatepass
  const printGatepass = (saleData, gatePassData) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('FLOUR MILL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text('GATE PASS', 105, 30, { align: 'center' });

      // Gate Pass Details
      doc.setFontSize(10);
      doc.text(`Gate Pass #: ${gatePassData?.gatePassNumber || 'AUTO-GENERATED'}`, 20, 45);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 52);
      doc.text(`Type: Material`, 20, 59);
      doc.text(`Purpose: Stock Dispatch for Sale`, 20, 66);

      // Issued To
      doc.setFontSize(12);
      doc.text('Issued To:', 20, 80);
      doc.setFontSize(10);
      doc.text(`Name: ${saleData.customer?.name || 'N/A'}`, 20, 87);
      if (saleData.customer?.contact?.phone) {
        doc.text(`Contact: ${saleData.customer.contact.phone}`, 20, 94);
      }

      // Items
      doc.setFontSize(12);
      doc.text('Items to Dispatch:', 20, 105);

      let finalY = 112;
      if (saleData.items && Array.isArray(saleData.items) && saleData.items.length > 0) {
        try {
          // Try to use autoTable if available
          if (typeof doc.autoTable === 'function') {
            const itemsData = saleData.items.map(item => [
              (item.productName || item.name || item.description || 'N/A').toString().substring(0, 30),
              (item.quantity || 0).toString(),
              (item.unit || 'units').toString(),
              `Rs. ${(parseFloat(item.totalPrice) || parseFloat(item.value) || 0).toFixed(2)}`
            ]);

            doc.autoTable({
              startY: 112,
              head: [['Product', 'Quantity', 'Unit', 'Value']],
              body: itemsData,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [66, 139, 202] }
            });

            finalY = doc.lastAutoTable.finalY + 10;
          } else {
            throw new Error('autoTable not available');
          }
        } catch (autoTableError) {
          // Fallback: Manual table creation
          console.warn('autoTable not available, using manual table:', autoTableError);
          doc.setFontSize(10);
          (saleData.items || []).forEach((item, index) => {
            if (finalY > 250) {
              doc.addPage();
              finalY = 20;
            }
            const itemText = `${index + 1}. ${item.productName || item.name || item.description || 'N/A'} - Qty: ${item.quantity || 0} ${item.unit || 'units'} - Value: Rs. ${(parseFloat(item.totalPrice) || parseFloat(item.value) || 0).toFixed(2)}`;
            doc.text(itemText, 20, finalY);
            finalY += 7;
          });
          finalY += 5;
        }
      } else {
        // No items
        doc.setFontSize(10);
        doc.text('No items to dispatch.', 20, finalY);
        finalY += 10;
      }

      // Warehouse Info
      doc.setFontSize(10);
      const warehouseName = warehouses.find(w => w._id === saleData.warehouse)?.name || 'N/A';
      doc.text(`Warehouse: ${warehouseName}`, 20, finalY);

      // Authorization
      doc.setFontSize(10);
      doc.text('Authorized By:', 20, finalY + 20);
      doc.text('_________________', 20, finalY + 30);
      doc.text('Signature', 20, finalY + 37);

      doc.text('Received By:', 120, finalY + 20);
      doc.text('_________________', 120, finalY + 30);
      doc.text('Signature', 120, finalY + 37);

      // Footer
      doc.setFontSize(8);
      doc.text('This gate pass is valid for stock dispatch only.', 105, 280, { align: 'center' });

      doc.save(`GatePass-${gatePassData?.gatePassNumber || 'AUTO'}.pdf`);
    } catch (error) {
      console.error('Error printing gatepass:', error);
      alert('Error generating gatepass PDF: ' + error.message);
    }
  };

  // Print Invoice and Gatepass
  const printInvoiceAndGatepass = (saleData, gatePassData) => {
    printInvoice(saleData);
    setTimeout(() => {
      printGatepass(saleData, gatePassData);
    }, 500);
  };

  const handleSubmit = async (e, printAction = null) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    const newErrors = {};
    if (!formData.customerId) {
      newErrors.customerName = 'Please select a customer';
    }
    if (!formData.warehouse) {
      newErrors.warehouse = 'Please select a warehouse';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    const total = calculateTotal();

    if (formData.paymentStatus === 'Partial') {
      const partialPaid = safeNumber(formData.paidAmount);
      if (partialPaid <= 0) {
        newErrors.paidAmount = 'Enter the amount received from the customer';
      } else if (partialPaid >= total) {
        newErrors.paidAmount = 'Partial payment must be less than total amount';
      }
    }

    if (formData.paymentStatus === 'Unpaid') {
      if (safeNumber(formData.paidAmount) !== 0) {
        newErrors.paidAmount = 'Paid amount must be zero for unpaid status';
      }
    }

    // Check credit limit for credit payments
    if (formData.paymentMethod === 'Credit' && formData.customerId) {
      const availableCredit = formData.customer.creditLimit - formData.customer.outstandingBalance;
      if (total > availableCredit) {
        newErrors.items = `Credit limit exceeded! Available credit: Rs. ${availableCredit.toFixed(2)}, Total purchase: Rs. ${total.toFixed(2)}`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      let paidAmount = 0;
      if (formData.paymentStatus === 'Total Paid') {
        paidAmount = total;
      } else if (formData.paymentStatus === 'Partial') {
        paidAmount = Math.min(safeNumber(formData.paidAmount), total);
      } else {
        paidAmount = 0;
      }
      const dueAmount = Math.max(total - paidAmount, 0);

      // Prepare sale data with proper structure
      const saleData = {
        customer: {
          customerId: formData.customerId,
          name: formData.customer.name,
          contact: formData.customer.contact,
          creditLimit: formData.customer.creditLimit,
          outstandingBalance: formData.customer.outstandingBalance
        },
        saleDate: formData.saleDate,
        items: formData.items,
        warehouse: formData.warehouse,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        paidAmount,
        dueAmount,
        discount: formData.discount,
        tax: formData.tax,
        notes: formData.notes,
        subtotal: formData.items.reduce((sum, item) => sum + item.totalPrice, 0),
        totalAmount: total
      };

      console.log('📤 Sending sale data:', saleData);
      const result = await onSubmit(saleData, printAction);

      // If print action is specified and sale was created successfully
      if (printAction && result?.success && result?.data) {
        const savedSale = result.data;
        const gatePassData = result.gatePass || null;

        if (printAction === 'print-invoice-gatepass') {
          printInvoiceAndGatepass(savedSale, gatePassData);
        } else if (printAction === 'print-and-save') {
          printInvoiceAndGatepass(savedSale, gatePassData);
        }
      }
    } catch (error) {
      console.error('Error submitting sale:', error);
      setErrors({ submit: 'Failed to create sale' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = calculateTotal();
  const effectivePaidAmount = formData.paymentStatus === 'Total Paid'
    ? totalAmount
    : formData.paymentStatus === 'Partial'
      ? Math.min(safeNumber(formData.paidAmount), totalAmount)
      : 0;
  const computedDueAmount = Math.max(totalAmount - effectivePaidAmount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaShoppingCart className="mr-2 text-blue-500" />
              {editData ? 'Edit Sale' : 'New Sale'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber || "Auto-generated"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  placeholder="Auto-generated"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Invoice number will be generated automatically</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Date *
                </label>
                <input
                  type="date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Customer Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer *
                </label>
                <CustomerSearch
                  onCustomerSelect={handleCustomerSelect}
                  selectedCustomer={selectedCustomerObj}
                  placeholder="Search customer by name, email, phone, or ID..."
                />
                {errors.customer?.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer.name}</p>
                )}
              </div>

              {/* Customer Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="customer.contact.phone"
                    value={formData.customer.contact.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+92-300-1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="customer.contact.email"
                    value={formData.customer.contact.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@example.com"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customer.contact.address"
                    value={formData.customer.contact.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer address (can be edited)"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (formData.customerId) {
                        try {
                          // Fetch full customer data from database
                          const response = await api.get(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(formData.customerId));

                          if (response.data?.success) {
                            const customer = response.data.data;

                            if (customer?.address) {
                              // Format address from customer's saved data
                              const addressParts = [
                                customer.address.street,
                                customer.address.city,
                                customer.address.state,
                                customer.address.zipCode
                              ].filter(Boolean);

                              const address = addressParts.join(', ');

                              setFormData(prev => ({
                                ...prev,
                                customer: {
                                  ...prev.customer,
                                  contact: {
                                    ...prev.customer.contact,
                                    address: address
                                  }
                                }
                              }));

                              // Update selected customer object
                              setSelectedCustomerObj(customer);
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching customer:', error);
                          alert('Failed to fetch customer address');
                        }
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded border border-gray-300 hover:border-blue-300 transition-colors"
                    title="Reset to customer's saved address"
                  >
                    Reset
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Address can be manually edited or reset to customer's saved address</p>
              </div>

              {/* Customer Credit Information */}
              {formData.customerId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (Rs.) *
                    </label>
                    <input
                      type="number"
                      name="customer.creditLimit"
                      value={formData.customer.creditLimit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-900 font-semibold"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum credit allowed for this customer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outstanding Balance (Rs.) *
                    </label>
                    <input
                      type="number"
                      name="customer.outstandingBalance"
                      value={formData.customer.outstandingBalance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-900 font-semibold"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Remaining amount to be paid from previous purchases</p>
                  </div>
                </div>
              )}

              {/* Credit Available Display */}
              {formData.customerId && formData.customer.creditLimit > 0 && (
                <div className="mt-2 p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Available Credit:</span>
                    <span className={`text-lg font-bold ${(formData.customer.creditLimit - formData.customer.outstandingBalance - calculateTotal()) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                      }`}>
                      Rs. {Math.max(0, (formData.customer.creditLimit - formData.customer.outstandingBalance - calculateTotal())).toFixed(2)}
                    </span>
                  </div>
                  {calculateTotal() > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current Purchase: Rs. {calculateTotal().toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Clear Customer Button */}
              {formData.customerId && (
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <FaTimes className="mr-1" />
                  Clear Customer Selection
                </button>
              )}
            </div>

            {/* Warehouse Selection - MUST BE FIRST */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaBoxes className="mr-2 text-blue-500" />
                Select Warehouse *
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Warehouse
                </label>
                <select
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={(e) => {
                    handleInputChange(e);
                    // Reset selected product when warehouse changes
                    setSelectedProduct('');
                    setItemQuantity('');
                    setItemUnitPrice('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose warehouse first</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
                {!formData.warehouse && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Please select a warehouse to view available products</p>
                )}
              </div>
            </div>

            {/* Product Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaBoxes className="mr-2 text-green-500" />
                Add Products to Sale
              </h3>

              {!formData.warehouse ? (
                <div className="text-center py-8 bg-yellow-50 rounded-md border border-yellow-200">
                  <p className="text-yellow-700">Please select a warehouse first to add products</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Product
                      </label>
                      <select
                        value={selectedProduct}
                        onChange={(e) => {
                          setSelectedProduct(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.warehouse}
                      >
                        <option value="">Choose product</option>
                        {products.filter(p => p.status === 'Active').map(product => {
                          const stock = inventoryStock[product._id] || 0;
                          // Determine if this is a bag product (Finished Goods or Packaging Materials)
                          const isBagProduct = product.category === 'Finished Goods' ||
                            product.category === 'Packaging Materials' ||
                            product.name.toLowerCase().includes('bag') ||
                            product.name.toLowerCase().includes('flour') ||
                            product.name.toLowerCase().includes('maida') ||
                            product.name.toLowerCase().includes('suji');
                          const displayUnit = isBagProduct ? 'units' : (product.unit || 'units');

                          return (
                            <option key={product._id} value={product._id}>
                              {product.name} ({product.code}) - Stock: {stock} {displayUnit}
                            </option>
                          );
                        })}
                      </select>
                      {selectedProduct && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-700">
                            <strong>Product:</strong> {products.find(p => p._id === selectedProduct)?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-blue-600">
                            <strong>Available Stock:</strong> {availableStock} {(() => {
                              const prod = products.find(p => p._id === selectedProduct);
                              if (!prod) return 'units';
                              const isBagProduct = prod.category === 'Finished Goods' ||
                                prod.category === 'Packaging Materials' ||
                                prod.name.toLowerCase().includes('bag') ||
                                prod.name.toLowerCase().includes('flour') ||
                                prod.name.toLowerCase().includes('maida') ||
                                prod.name.toLowerCase().includes('suji');
                              return isBagProduct ? 'units' : (prod.unit || 'units');
                            })()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Price:</strong> Rs. {products.find(p => p._id === selectedProduct)?.price || 0}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      {selectedProduct && itemQuantity && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {availableStock} {(() => {
                            const prod = products.find(p => p._id === selectedProduct);
                            if (!prod) return 'units';
                            const isBagProduct = prod.category === 'Finished Goods' ||
                              prod.category === 'Packaging Materials' ||
                              prod.name.toLowerCase().includes('bag') ||
                              prod.name.toLowerCase().includes('flour') ||
                              prod.name.toLowerCase().includes('maida') ||
                              prod.name.toLowerCase().includes('suji');
                            return isBagProduct ? 'units' : (prod.unit || 'units');
                          })()}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price (Rs.)
                      </label>
                      <input
                        type="number"
                        value={itemUnitPrice}
                        onChange={(e) => setItemUnitPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-filled from inventory</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Price
                      </label>
                      <input
                        type="text"
                        value={itemQuantity && itemUnitPrice ? (parseFloat(itemQuantity || 0) * parseFloat(itemUnitPrice || 0)).toFixed(2) : '0.00'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 font-semibold"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addItem}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                      >
                        <FaPlus className="mr-2" />
                        Add Item
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  {formData.items.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Items Added:</h4>
                      <div className="space-y-2">
                        {formData.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border">
                            <div className="flex-1">
                              <span className="font-medium">{item.productName}</span>
                              <span className="text-gray-600 ml-2">({item.quantity} {item.unit})</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-gray-600">Rs. {item.unitPrice}/unit</span>
                              <span className="font-medium">Rs. {item.totalPrice.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error Messages */}
            {errors.warehouse && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.warehouse}</p>
              </div>
            )}
            {errors.customerName && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.customerName}</p>
              </div>
            )}
            {errors.items && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.items}</p>
              </div>
            )}
            {errors.paymentMethod && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.paymentMethod}</p>
              </div>
            )}
            {errors.submit && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Payment Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaMoneyBillWave className="mr-2 text-green-500" />
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
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
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status *
                  </label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial Payment</option>
                    <option value="Total Paid">Total Paid</option>
                  </select>
                </div>
              </div>

              {formData.paymentStatus === 'Partial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Received (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    {errors.paidAmount && (
                      <p className="text-sm text-red-600 mt-1">{errors.paidAmount}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remaining Amount (Rs.)
                    </label>
                    <input
                      type="text"
                      value={computedDueAmount.toFixed(2)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">Automatically calculated as Total - Paid</p>
                  </div>
                </div>
              )}

              {formData.paymentStatus !== 'Partial' && errors.paidAmount && (
                <p className="text-sm text-red-600 mt-2">{errors.paidAmount}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-md p-4 border">
                  <p className="text-xs uppercase text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{`Rs. ${totalAmount.toFixed(2)}`}</p>
                </div>
                <div className="bg-white rounded-md p-4 border">
                  <p className="text-xs uppercase text-gray-500">Amount Paid</p>
                  <p className="text-lg font-semibold text-green-600">{`Rs. ${effectivePaidAmount.toFixed(2)}`}</p>
                </div>
                <div className="bg-white rounded-md p-4 border">
                  <p className="text-xs uppercase text-gray-500">Amount Due</p>
                  <p className="text-lg font-semibold text-red-600">{`Rs. ${computedDueAmount.toFixed(2)}`}</p>
                </div>
              </div>
            </div>

            {/* Discount and Tax Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  name="discount.type"
                  value={formData.discount.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  name="discount.value"
                  value={formData.discount.value}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax (Rs.)
                </label>
                <input
                  type="number"
                  name="tax"
                  value={formData.tax}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Total Calculation */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-blue-600">Rs. {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {!editData && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      // Print preview without saving - use current form data
                      const total = calculateTotal();
                      const paidAmount = formData.paymentStatus === 'Total Paid'
                        ? total
                        : formData.paymentStatus === 'Partial'
                          ? Math.min(safeNumber(formData.paidAmount), total)
                          : 0;
                      const dueAmount = Math.max(total - paidAmount, 0);

                      const previewSaleData = {
                        invoiceNumber: 'PREVIEW',
                        customer: formData.customer,
                        saleDate: formData.saleDate,
                        items: formData.items,
                        warehouse: formData.warehouse,
                        paymentMethod: formData.paymentMethod,
                        paymentStatus: formData.paymentStatus,
                        paidAmount,
                        dueAmount,
                        discount: formData.discount,
                        tax: formData.tax,
                        subtotal: formData.items.reduce((sum, item) => sum + item.totalPrice, 0),
                        totalAmount: total
                      };

                      const previewGatePass = {
                        gatePassNumber: 'PREVIEW',
                        status: 'Active',
                        type: 'Material',
                        purpose: 'Stock Dispatch for Sale'
                      };

                      // Print both previews
                      printInvoice(previewSaleData);
                      setTimeout(() => {
                        printGatepass(previewSaleData, previewGatePass);
                      }, 500);
                    }}
                    disabled={isSubmitting || formData.items.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <FaPrint className="mr-2" />
                    Print Invoice & Gatepass
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'print-and-save')}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
                  >
                    <FaPrint className="mr-2" />
                    Print & Save
                  </button>
                </>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <FaCalculator className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {editData ? 'Update Sale' : 'Save Sale'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
