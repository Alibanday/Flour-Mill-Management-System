import Customer from '../model/CustomerNew.js';
import Employee from '../model/Employee.js';
import Warehouse from '../model/wareHouse.js';
import { createNotification } from '../services/notificationService.js';
import eventEmitter from '../utils/eventEmitter.js';

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      createdBy: req.user.id
    });

    await customer.save();

    // Emit event for new customer creation
    eventEmitter.emit('customerCreated', customer);
    await createNotification('customer', 'New Customer Added', `Customer ${customer.firstName} ${customer.lastName} has been registered.`, req.user.id, customer._id);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Customer with this email or phone already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating customer',
        error: error.message
      });
    }
  }
};

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, customerType, status, businessType } = req.query;
    
    let query = {};
    
    // Apply filters
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (customerType) query.customerType = customerType;
    if (status) query.status = status;
    if (businessType) query.businessType = businessType;

    const customers = await Customer.find(query)
      .populate('assignedSalesRep', 'firstName lastName employeeId')
      .populate('warehouse', 'name location')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCustomers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedSalesRep', 'firstName lastName employeeId email phone')
      .populate('warehouse', 'name location address')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update customer information
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        customer[key] = req.body[key];
      }
    });

    customer.updatedBy = req.user.id;
    await customer.save();

    // Emit event for customer update
    eventEmitter.emit('customerUpdated', customer);
    await createNotification('customer', 'Customer Updated', `Customer ${customer.firstName} ${customer.lastName} has been updated.`, req.user.id, customer._id);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Customer with this email or phone already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating customer',
        error: error.message
      });
    }
  }
};

// Update customer status
export const updateCustomerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Active', 'Inactive', 'Suspended', 'Blacklisted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Inactive, Suspended, or Blacklisted'
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.user.id },
      { new: true }
    ).populate('assignedSalesRep', 'firstName lastName');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Emit event for customer status update
    eventEmitter.emit('customerStatusUpdated', customer);
    await createNotification('customer', 'Customer Status Updated', `Customer ${customer.firstName} ${customer.lastName} status changed to ${status}.`, req.user.id, customer._id);

    res.json({
      success: true,
      message: `Customer status updated to ${status}`,
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer status',
      error: error.message
    });
  }
};

// Assign sales representative
export const assignSalesRep = async (req, res) => {
  try {
    const { salesRepId } = req.body;

    // Verify sales rep exists
    const salesRep = await Employee.findById(salesRepId);
    if (!salesRep) {
      return res.status(404).json({
        success: false,
        message: 'Sales representative not found'
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { assignedSalesRep: salesRepId, updatedBy: req.user.id },
      { new: true }
    ).populate('assignedSalesRep', 'firstName lastName employeeId');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Emit event for sales rep assignment
    eventEmitter.emit('customerSalesRepAssigned', customer);
    await createNotification('customer', 'Sales Rep Assigned', `Customer ${customer.firstName} ${customer.lastName} assigned to ${customer.assignedSalesRep.firstName} ${customer.assignedSalesRep.lastName}.`, req.user.id, customer._id);

    res.json({
      success: true,
      message: 'Sales representative assigned to customer',
      data: customer
    });
  } catch (error) {
    console.error('Error assigning sales representative:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning sales representative',
      error: error.message
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has any orders (you might want to implement this check)
    // For now, we'll allow deletion but you can add business logic here

    await Customer.findByIdAndDelete(req.params.id);

    // Emit event for customer deletion
    eventEmitter.emit('customerDeleted', customer);
    await createNotification('customer', 'Customer Deleted', `Customer ${customer.firstName} ${customer.lastName} has been deleted.`, req.user.id, customer._id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

// Get customer statistics
export const getCustomerStats = async (req, res) => {
  try {
    const stats = await Customer.getCustomerStats();
    const customersByType = await Customer.getCustomersByType();
    const topCustomers = await Customer.getTopCustomers(5);

    // Recent customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCustomers = await Customer.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerId firstName lastName businessName createdAt');

    res.json({
      success: true,
      data: {
        ...stats,
        customersByType,
        topCustomers,
        recentCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer statistics',
      error: error.message
    });
  }
};

// Get customers by sales representative
export const getCustomersBySalesRep = async (req, res) => {
  try {
    const { salesRepId } = req.params;
    const customers = await Customer.find({ assignedSalesRep: salesRepId })
      .populate('assignedSalesRep', 'firstName lastName employeeId')
      .populate('warehouse', 'name location');

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers by sales rep:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers by sales representative',
      error: error.message
    });
  }
};

// Search customers for sales
export const searchCustomersForSales = async (req, res) => {
  try {
    const { search, limit = 10 } = req.query;
    
    if (!search || search.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const customers = await Customer.find({
      status: 'Active',
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ]
    })
    .select('customerId firstName lastName businessName phone email customerType creditLimit creditUsed paymentTerms address customerNumber')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching customers',
      error: error.message
    });
  }
};

// Update customer credit
export const updateCustomerCredit = async (req, res) => {
  try {
    const { creditLimit, creditUsed } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { 
        creditLimit: creditLimit || 0,
        creditUsed: creditUsed || 0,
        updatedBy: req.user.id 
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer credit updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer credit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer credit',
      error: error.message
    });
  }
};

// Get customer dashboard data
export const getCustomerDashboard = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await Customer.findById(customerId)
      .populate('assignedSalesRep', 'firstName lastName email phone')
      .populate('warehouse', 'name location');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Here you would typically fetch additional data like:
    // - Recent orders
    // - Payment history
    // - Credit transactions
    // - Communication history
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer dashboard',
      error: error.message
    });
  }
};
