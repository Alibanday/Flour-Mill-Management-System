import Sale from "../model/Sale.js";
import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";
import CustomerNew from "../model/CustomerNew.js";
import GatePass from "../model/GatePass.js";
import User from "../model/user.js";

// Create sale with real-time inventory integration
export const createSale = async (req, res) => {
  try {
    console.log("Sale creation - User ID:", req.user._id || req.user.id);
    console.log("Sale creation - User object:", req.user);

    const {
      customer,
      items,
      warehouse,
      saleDate,
      paymentMethod,
      paymentStatus,
      paidAmount,
      dueAmount,
      discount,
      tax,
      notes
    } = req.body;

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;

    // REAL-TIME INVENTORY INTEGRATION - Check stock availability first
    for (const item of items) {
      // Verify product exists
      const product = await Inventory.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }

      // Check stock availability using 'weight' field (old inventory model doesn't have currentStock)
      const availableStock = product.weight || 0;
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        });
      }

      // Calculate total price for item
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      // Validate and set unit - ensure it matches enum values
      const validUnits = ["kg", "tons", "bags", "pcs", "units", "25kg bags", "50kg bags", "10kg bags", "5kg bags", "100kg sacks", "50kg sacks", "25kg sacks"];
      let itemUnit = item.unit || 'units';
      // If unit doesn't match enum, default to 'units'
      if (!validUnits.includes(itemUnit)) {
        console.warn(`Invalid unit "${itemUnit}" for product ${product.name}, using "units"`);
        itemUnit = 'units';
      }

      processedItems.push({
        product: item.product,
        productName: product.name,
        quantity: item.quantity,
        unit: itemUnit,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice
      });
    }

    // Calculate discount amount and ensure discount object structure
    let discountAmount = 0;
    let discountType = 'none';
    let discountValue = 0;
    
    if (discount) {
      if (typeof discount === 'object') {
        discountType = discount.type || 'none';
        discountValue = discount.value || 0;
        
        if (discountType === 'percentage') {
          discountAmount = (subtotal * discountValue) / 100;
        } else if (discountType === 'fixed') {
          discountAmount = discountValue;
        } else {
          discountType = 'none';
          discountAmount = 0;
        }
      } else if (typeof discount === 'number') {
        // If discount is a number, treat it as fixed amount
        discountType = 'fixed';
        discountValue = discount;
        discountAmount = discount;
      }
    }

    // Calculate total amount
    const taxAmount = tax || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Calculate payment amounts
    const paidAmountValue = paidAmount ? parseFloat(paidAmount) : 0;
    const dueAmountValue = dueAmount !== undefined ? parseFloat(dueAmount) : (totalAmount - paidAmountValue);
    const remainingAmountValue = Math.max(0, totalAmount - paidAmountValue);

    // Determine payment status - map frontend values to backend enum values
    let finalPaymentStatus = paymentStatus;
    if (finalPaymentStatus === 'Total Paid') {
      finalPaymentStatus = 'Paid';
    } else if (finalPaymentStatus === 'Unpaid') {
      finalPaymentStatus = 'Pending';
    }
    
    // Auto-determine if not provided
    if (!finalPaymentStatus) {
      if (paidAmountValue >= totalAmount) {
        finalPaymentStatus = 'Paid';
      } else if (paidAmountValue > 0) {
        finalPaymentStatus = 'Partial';
      } else {
        finalPaymentStatus = 'Pending';
      }
    }

    // CREDIT LIMIT VALIDATION - Check if customer exists and validate credit limit
    if (customer?.customerId) {
      const customerDoc = await CustomerNew.findById(customer.customerId);
      if (customerDoc) {
        const currentCreditUsed = customerDoc.creditUsed || 0;
        const creditLimit = customerDoc.creditLimit || 0;
        
        // Calculate how much credit will be used (remaining amount after payment)
        const creditToBeUsed = remainingAmountValue;
        
        // For Credit payment method or if there's any remaining amount
        if (paymentMethod === 'Credit' || creditToBeUsed > 0) {
          const newCreditUsed = currentCreditUsed + creditToBeUsed;
          
          // Validate credit limit
          if (newCreditUsed > creditLimit) {
            return res.status(400).json({
              success: false,
              message: `Credit limit exceeded! Current credit used: Rs. ${currentCreditUsed.toFixed(2)}, Credit limit: Rs. ${creditLimit.toFixed(2)}, Remaining amount: Rs. ${creditToBeUsed.toFixed(2)}, New total would be: Rs. ${newCreditUsed.toFixed(2)}`
            });
          }
        }
      }
    }

    // Validate customer name is present
    if (!customer || !customer.name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required"
      });
    }

    // Validate payment method
    const validPaymentMethods = ["Cash", "Bank Transfer", "Cheque", "Credit"];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`
      });
    }

    // Ensure customer object has required name field
    const customerData = {
      ...customer,
      name: customer.name || customer.customerName || 'Unknown Customer'
    };

    // Create sale data with proper structure
    const saleData = {
      customer: customerData,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      items: processedItems,
      subtotal: subtotal,
      totalAmount: totalAmount,
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount
      },
      tax: taxAmount || 0,
      paymentMethod: paymentMethod,
      paymentStatus: finalPaymentStatus,
      paidAmount: paidAmountValue,
      remainingAmount: remainingAmountValue,
      dueAmount: remainingAmountValue,
      warehouse: warehouse,
      notes: notes || '',
      createdBy: req.user._id || req.user.id,
      status: paymentMethod === 'Credit' || remainingAmountValue > 0 ? 'Pending' : 'Completed'
    };

    console.log('Creating sale with data:', JSON.stringify(saleData, null, 2));

    // Validate sale data before creating
    let sale;
    try {
      sale = new Sale(saleData);
      
      // Validate the sale before saving
      const validationError = sale.validateSync();
      if (validationError) {
        console.error('Sale validation error:', validationError);
        const errors = {};
        Object.keys(validationError.errors || {}).forEach(key => {
          errors[key] = validationError.errors[key].message;
        });
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors,
          validationError: validationError.message
        });
      }
      
      await sale.save();
      console.log('Sale saved successfully:', sale.invoiceNumber);
    } catch (saveError) {
      console.error('Error saving sale:', saveError);
      console.error('Save error details:', {
        name: saveError.name,
        message: saveError.message,
        errors: saveError.errors,
        code: saveError.code,
        keyPattern: saveError.keyPattern,
        keyValue: saveError.keyValue
      });
      
      // Handle validation errors
      if (saveError.name === 'ValidationError') {
        const errors = {};
        Object.keys(saveError.errors || {}).forEach(key => {
          errors[key] = saveError.errors[key].message;
        });
        return res.status(400).json({
          success: false,
          message: "Validation error while saving sale",
          errors: errors
        });
      }
      
      // Handle duplicate key errors
      if (saveError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Duplicate entry. Invoice number already exists."
        });
      }
      
      throw saveError; // Re-throw to be caught by outer catch
    }

    // UPDATE CUSTOMER CREDIT USED - Update customer's creditUsed field
    if (customer?.customerId) {
      const customerDoc = await CustomerNew.findById(customer.customerId);
      if (customerDoc) {
        // Add the remaining amount (due amount) to customer's creditUsed
        const creditToAdd = remainingAmountValue;
        
        if (creditToAdd > 0) {
          customerDoc.creditUsed = (customerDoc.creditUsed || 0) + creditToAdd;
          await customerDoc.save();
          console.log(`Updated customer ${customerDoc.firstName} ${customerDoc.lastName} creditUsed: ${customerDoc.creditUsed}`);
        }

        // Update customer statistics
        customerDoc.totalOrders = (customerDoc.totalOrders || 0) + 1;
        customerDoc.totalSpent = (customerDoc.totalSpent || 0) + totalAmount;
        customerDoc.lastOrderDate = new Date();
        customerDoc.averageOrderValue = customerDoc.totalSpent / customerDoc.totalOrders;
        await customerDoc.save();
      }
    }

    // REAL-TIME INVENTORY INTEGRATION - Deduct stock from inventory
    console.log("Starting real-time inventory integration for sales...");

    for (const item of processedItems) {
      // Create stock out movement for each sold item
      const stockOut = new Stock({
        inventoryItem: item.product,
        movementType: 'out',
        quantity: item.quantity,
        reason: `Sale - Invoice ${sale.invoiceNumber}`,
        referenceNumber: sale.invoiceNumber,
        warehouse: warehouse,
        createdBy: req.user._id || req.user.id
      });

      await stockOut.save();
      console.log(`Deducted ${item.quantity} units of ${item.productName} for sale`);

      // Update product weight (old inventory model uses weight instead of currentStock)
      const updatedProduct = await Inventory.findByIdAndUpdate(
        item.product,
        { $inc: { weight: -item.quantity } },
        { new: true }
      );
      
      console.log(`Updated ${item.productName} weight: ${updatedProduct.weight}`);
      
      // Check if item is now low stock or out of stock
      if (updatedProduct.weight === 0) {
        // Create out of stock notification
        const notification = new Notification({
          title: "Product Out of Stock",
          message: `${item.productName} is now out of stock after sale`,
          type: "inventory",
          priority: "high",
          user: req.user._id || req.user.id,
          relatedEntity: "inventory",
          entityId: item.product,
          data: {
            productId: item.product,
            productName: item.productName,
            currentStock: 0,
            invoiceNumber: sale.invoiceNumber
          }
        });
        await notification.save();
      } else if (updatedProduct.weight <= 50) {
        // Create low stock notification (using 50 as threshold)
        const notification = new Notification({
          title: "Low Stock Alert",
          message: `${item.productName} is running low (${updatedProduct.weight} units remaining)`,
          type: "inventory",
          priority: "medium",
          user: req.user._id || req.user.id,
          relatedEntity: "inventory",
          entityId: item.product,
          data: {
            productId: item.product,
            productName: item.productName,
            currentStock: updatedProduct.weight,
            invoiceNumber: sale.invoiceNumber
          }
        });
        await notification.save();
      }
    }

    // Create sale completion notification
    const saleNotification = new Notification({
      title: "Sale Completed",
      message: `Sale invoice ${sale.invoiceNumber} has been processed successfully`,
      type: "sales",
      priority: "low",
      user: req.user._id || req.user.id,
      relatedEntity: "sale",
      entityId: sale._id,
      data: {
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        totalAmount: totalAmount,
        customerName: customer.name
      }
    });

    await saleNotification.save();

    // AUTO-GENERATE GATE PASS
    let gatePass = null;
    try {
      // Get warehouse details
      const warehouseDoc = await Warehouse.findById(warehouse).populate('manager', 'firstName lastName email');
      
      if (!warehouseDoc) {
        console.error('Warehouse not found for gatepass creation:', warehouse);
        throw new Error('Warehouse not found');
      }
      
      // Create gate pass items from sale items - ensure all required fields
      const gatePassItems = items.map(item => {
        // Ensure description is a non-empty string
        const description = (item.productName || item.name || 'Product').toString().trim();
        // Ensure quantity is a positive number
        const quantity = Math.max(1, parseFloat(item.quantity) || 1);
        // Ensure unit is a non-empty string
        const unit = (item.unit || 'units').toString().trim();
        // Value is optional but should be a number
        const value = parseFloat(item.totalPrice) || 0;
        
        return {
          description: description || 'Product',
          quantity: quantity,
          unit: unit || 'units',
          value: value
        };
      }).filter(item => item.description && item.quantity > 0); // Filter out invalid items

      // Extract customer name safely - ensure it's a string
      let customerName = 'Customer';
      if (typeof customer === 'string') {
        customerName = customer;
      } else if (customer && typeof customer === 'object') {
        customerName = (customer.name || customer.customerName || customer.firstName || 'Customer').toString().trim();
      }
      
      // Extract customer contact - ensure it's a string
      let customerContact = 'N/A';
      if (customer && typeof customer === 'object') {
        if (customer.contact) {
          if (typeof customer.contact === 'string') {
            customerContact = customer.contact.trim();
          } else if (typeof customer.contact === 'object') {
            customerContact = (customer.contact.phone || customer.contact.email || 'N/A').toString().trim();
          }
        } else {
          customerContact = (customer.phone || customer.email || 'N/A').toString().trim();
        }
      }
      
      // Ensure contact is not empty
      if (!customerContact || customerContact === '') {
        customerContact = 'N/A';
      }

      // Validate gate pass data before creating
      if (!customerName || customerName.trim() === '') {
        customerName = 'Customer';
      }
      if (!customerContact || customerContact.trim() === '') {
        customerContact = 'N/A';
      }
      if (gatePassItems.length === 0) {
        throw new Error('No valid items for gate pass');
      }

      // Create gate pass
      gatePass = new GatePass({
        type: 'Material',
        purpose: 'Stock Dispatch for Sale',
        issuedTo: {
          name: customerName,
          contact: customerContact,
          company: customerName || ''
        },
        items: gatePassItems,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        issuedBy: req.user._id || req.user.id,
        warehouse: warehouse,
        status: 'Active',
        relatedSale: sale._id,
        notes: `Auto-generated for Sale Invoice ${sale.invoiceNumber || sale._id}`
      });

      await gatePass.save();
      console.log(`✅ Gate pass ${gatePass.gatePassNumber} created for sale ${sale.invoiceNumber}`);

      // NOTIFY WAREHOUSE MANAGER - Send gatepass notification
      let notificationSent = false;
      if (warehouseDoc?.manager) {
        try {
          const managerId = warehouseDoc.manager._id || warehouseDoc.manager;
          const managerNotification = new Notification({
            title: "New Gate Pass - Stock Dispatch Required",
            message: `Gate Pass ${gatePass.gatePassNumber} has been generated for Sale Invoice ${sale.invoiceNumber}. Please prepare stock for dispatch. Customer: ${customerName}. Items: ${gatePassItems.length} item(s).`,
            type: "warehouse_transfer",
            priority: "high",
            user: managerId,
            recipient: managerId, // Also set recipient field for compatibility
            sender: req.user._id || req.user.id,
            relatedEntity: "warehouse", // Changed from "gatepass" to "warehouse" (valid enum value)
            entityId: gatePass._id,
            status: "unread",
            data: {
              gatePassNumber: gatePass.gatePassNumber,
              gatePassId: gatePass._id,
              saleInvoiceNumber: sale.invoiceNumber || sale._id,
              saleId: sale._id,
              warehouse: warehouseDoc?.name || warehouseDoc?.warehouseName || 'Warehouse',
              warehouseId: warehouse,
              items: gatePassItems,
              customerName: customerName,
              totalItems: gatePassItems.length,
              totalValue: gatePassItems.reduce((sum, item) => sum + (item.value || 0), 0)
            },
            metadata: {
              gatePassNumber: gatePass.gatePassNumber,
              saleInvoiceNumber: sale.invoiceNumber,
              warehouse: warehouseDoc?.name || 'Warehouse'
            }
          });
          await managerNotification.save();
          notificationSent = true;
          console.log(`✅ Notification sent to warehouse manager: ${warehouseDoc.manager.email || warehouseDoc.manager.firstName}`);
          console.log(`📋 Gate Pass ${gatePass.gatePassNumber} is now available for warehouse manager`);
        } catch (notifyError) {
          console.error('❌ Error sending notification to warehouse manager:', notifyError);
          // Don't fail the sale creation if notification fails
        }
      } else {
        // If no manager assigned to warehouse, find warehouse managers by warehouse assignment
        try {
          // First, try to find warehouse managers assigned to this warehouse
          const warehouseManagers = await User.find({
            $or: [
              { role: 'Warehouse Manager', warehouse: warehouse },
              { role: 'Admin' }
            ]
          }).limit(10); // Limit to prevent too many notifications
          
          if (warehouseManagers.length > 0) {
            for (const manager of warehouseManagers) {
              try {
                const managerNotification = new Notification({
                  title: "New Gate Pass - Stock Dispatch Required",
                  message: `Gate Pass ${gatePass.gatePassNumber} has been generated for Sale Invoice ${sale.invoiceNumber || sale._id}. Warehouse: ${warehouseDoc?.name || 'Warehouse'}. Please prepare stock for dispatch.`,
                  type: "warehouse_transfer",
                  priority: "high",
                  user: manager._id,
                  recipient: manager._id,
                  sender: req.user._id || req.user.id,
                  relatedEntity: "warehouse",
                  entityId: gatePass._id,
                  status: "unread",
                  data: {
                    gatePassNumber: gatePass.gatePassNumber,
                    gatePassId: gatePass._id,
                    saleInvoiceNumber: sale.invoiceNumber || sale._id,
                    saleId: sale._id,
                    warehouse: warehouseDoc?.name || warehouseDoc?.warehouseName || 'Warehouse',
                    warehouseId: warehouse,
                    items: gatePassItems,
                    customerName: customerName,
                    totalItems: gatePassItems.length,
                    totalValue: gatePassItems.reduce((sum, item) => sum + (item.value || 0), 0)
                  },
                  metadata: {
                    gatePassNumber: gatePass.gatePassNumber,
                    saleInvoiceNumber: sale.invoiceNumber,
                    warehouse: warehouseDoc?.name || 'Warehouse'
                  }
                });
                await managerNotification.save();
                notificationSent = true;
              } catch (notifyError) {
                console.error(`❌ Error sending notification to manager ${manager.email}:`, notifyError);
              }
            }
            console.log(`✅ Notifications sent to ${warehouseManagers.length} warehouse managers/admins`);
          } else {
            console.warn(`⚠️ No warehouse manager found for warehouse ${warehouse}. Gate pass created but no notification sent.`);
          }
        } catch (findError) {
          console.error('❌ Error finding warehouse managers:', findError);
        }
      }
      
      if (!notificationSent) {
        console.warn(`⚠️ Gate Pass ${gatePass.gatePassNumber} created but notification not sent. Warehouse manager may need to check gatepass list manually.`);
      }
    } catch (gatePassError) {
      console.error('Error creating gate pass:', gatePassError);
      // Don't fail the sale creation if gate pass creation fails
      // Just log the error
    }

    // Populate the response
    await sale.populate('warehouse', 'name location');
    await sale.populate('createdBy', 'firstName lastName');

    // Prepare response
    const responseData = {
      success: true,
      message: "Sale created successfully with real-time inventory integration",
      data: sale,
      gatePass: gatePass ? {
        _id: gatePass._id,
        gatePassNumber: gatePass.gatePassNumber,
        status: gatePass.status,
        warehouse: gatePass.warehouse
      } : null
    };

    // Add notification status if gatepass was created
    if (gatePass) {
      responseData.gatePassNotification = notificationSent 
        ? "Gate pass notification sent to warehouse manager"
        : "Gate pass created but notification not sent (warehouse manager may check gatepass list)";
      responseData.gatePassAccessible = true;
      responseData.message += `. Gate pass ${gatePass.gatePassNumber} has been shared with the warehouse manager.`;
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error("Create sale error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      customer: customer,
      warehouse: warehouse,
      items: items
    });
    res.status(500).json({
      success: false,
      message: "Server error while creating sale",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all sales
export const getAllSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      warehouse,
      startDate,
      endDate,
      paymentMethod
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Sale.countDocuments(filter);
    
    // Get sales with pagination
    const sales = await Sale.find(filter)
      .populate('warehouse', 'name location')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sales",
      error: error.message
    });
  }
};

// Get single sale
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("warehouse", "name location")
      .populate("createdBy", "firstName lastName");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    res.json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error("Get sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sale",
      error: error.message
    });
  }
};

// Update sale
export const updateSale = async (req, res) => {
  try {
    // Check if sale exists
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    // Update sale record
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("warehouse", "name location")
     .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale
    });

  } catch (error) {
    console.error("Update sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating sale",
      error: error.message
    });
  }
};

// Delete sale
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sale deleted successfully"
    });

  } catch (error) {
    console.error("Delete sale error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting sale",
      error: error.message
    });
  }
};

// Process return with real-time inventory integration
export const processReturn = async (req, res) => {
  try {
    const { saleId, items, reason } = req.body;

    // Get the original sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    // Process return items
    for (const returnItem of items) {
      // Find the original item in the sale
      const originalItem = sale.items.find(item => item.product.toString() === returnItem.product);
      if (!originalItem) {
        return res.status(400).json({
          success: false,
          message: `Product not found in original sale`
        });
      }

      if (returnItem.quantity > originalItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity (${returnItem.quantity}) cannot exceed original quantity (${originalItem.quantity})`
        });
      }

      // Add stock back to inventory
      const stockIn = new Stock({
        inventoryItem: returnItem.product,
        movementType: 'in',
        quantity: returnItem.quantity,
        reason: `Return - Sale ${sale.invoiceNumber}`,
        referenceNumber: `RETURN-${sale.invoiceNumber}`,
        warehouse: sale.warehouse,
        createdBy: req.user._id || req.user.id
      });

      await stockIn.save();
      console.log(`Added ${returnItem.quantity} units back to inventory for return`);
    }

    // Create return notification
    const notification = new Notification({
      title: "Product Return Processed",
      message: `Return processed for sale ${sale.invoiceNumber}`,
      type: "sales",
      priority: "medium",
      user: req.user._id || req.user.id,
      relatedEntity: "sale",
      entityId: sale._id,
      data: {
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        returnReason: reason
      }
    });

    await notification.save();

    res.json({
      success: true,
      message: "Return processed successfully with inventory restocked",
      data: {
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        returnedItems: items
      }
    });

  } catch (error) {
    console.error("Process return error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing return",
      error: error.message
    });
  }
};
