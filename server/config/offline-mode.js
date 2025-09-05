// Offline mode configuration for development when MongoDB is not available
import mongoose from 'mongoose';

// Mock data for offline development
const mockData = {
  customers: [
    {
      _id: 'mock-customer-1',
      customerNumber: 'CUST-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+92-300-1234567',
      cnic: '12345-1234567-1',
      address: {
        street: '123 Main Street',
        city: 'Karachi',
        state: 'Sindh',
        zipCode: '75000',
        country: 'Pakistan'
      },
      businessInfo: {
        businessName: 'Doe Enterprises',
        businessType: 'Retailer',
        taxNumber: 'TAX-001'
      },
      creditInfo: {
        creditLimit: 100000,
        availableCredit: 75000,
        creditTerms: 30,
        creditStatus: 'Active'
      },
      status: 'Active',
      notes: 'Mock customer for offline development',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  stockTransfers: [
    {
      _id: 'mock-transfer-1',
      transferNumber: 'TRF-001',
      fromWarehouse: 'mock-warehouse-1',
      toWarehouse: 'mock-warehouse-2',
      transferType: 'Internal',
      priority: 'Normal',
      status: 'Completed',
      items: [
        {
          itemId: 'mock-item-1',
          itemName: 'Wheat Flour',
          quantity: 100,
          unit: 'kg'
        }
      ],
      expectedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  repackings: [
    {
      _id: 'mock-repacking-1',
      repackingNumber: 'REP-001',
      productType: 'Flour',
      sourceProduct: 'mock-item-1',
      targetProduct: 'mock-item-2',
      sourceQuantity: 100,
      targetQuantity: 95,
      wastageQuantity: 5,
      wastagePercentage: 5,
      repackingDate: new Date(),
      repackedBy: 'Mock User',
      supervisor: 'Mock Supervisor',
      qualityCheck: {
        passed: true,
        notes: 'Quality check passed',
        checkedBy: 'Mock QC'
      },
      costInfo: {
        laborCost: 500,
        materialCost: 200,
        totalCost: 700
      },
      status: 'Completed',
      notes: 'Mock repacking record',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  productionCosts: [
    {
      _id: 'mock-cost-1',
      date: new Date(),
      totalCost: 50000,
      laborCost: 20000,
      materialCost: 25000,
      overheadCost: 5000,
      productionVolume: 1000,
      costPerUnit: 50,
      breakdown: {
        labor: 40,
        material: 50,
        overhead: 10
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

// Offline mode flag
let isOfflineMode = false;

// Function to enable offline mode
export const enableOfflineMode = () => {
  isOfflineMode = true;
  console.log('🔄 Offline mode enabled - using mock data');
};

// Function to disable offline mode
export const disableOfflineMode = () => {
  isOfflineMode = false;
  console.log('🔄 Offline mode disabled - using real database');
};

// Function to check if offline mode is enabled
export const isOfflineModeEnabled = () => {
  return isOfflineMode;
};

// Mock database operations
export const mockDatabase = {
  // Customer operations
  customers: {
    find: (query = {}) => {
      console.log('📊 Mock: Finding customers with query:', query);
      return Promise.resolve(mockData.customers);
    },
    findById: (id) => {
      console.log('📊 Mock: Finding customer by ID:', id);
      return Promise.resolve(mockData.customers.find(c => c._id === id) || null);
    },
    create: (data) => {
      console.log('📊 Mock: Creating customer:', data);
      const newCustomer = {
        _id: `mock-customer-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockData.customers.push(newCustomer);
      return Promise.resolve(newCustomer);
    },
    findByIdAndUpdate: (id, data) => {
      console.log('📊 Mock: Updating customer:', id, data);
      const index = mockData.customers.findIndex(c => c._id === id);
      if (index !== -1) {
        mockData.customers[index] = { ...mockData.customers[index], ...data, updatedAt: new Date() };
        return Promise.resolve(mockData.customers[index]);
      }
      return Promise.resolve(null);
    },
    findByIdAndDelete: (id) => {
      console.log('📊 Mock: Deleting customer:', id);
      const index = mockData.customers.findIndex(c => c._id === id);
      if (index !== -1) {
        const deleted = mockData.customers.splice(index, 1)[0];
        return Promise.resolve(deleted);
      }
      return Promise.resolve(null);
    }
  },

  // Stock Transfer operations
  stockTransfers: {
    find: (query = {}) => {
      console.log('📊 Mock: Finding stock transfers with query:', query);
      return Promise.resolve(mockData.stockTransfers);
    },
    findById: (id) => {
      console.log('📊 Mock: Finding stock transfer by ID:', id);
      return Promise.resolve(mockData.stockTransfers.find(t => t._id === id) || null);
    },
    create: (data) => {
      console.log('📊 Mock: Creating stock transfer:', data);
      const newTransfer = {
        _id: `mock-transfer-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockData.stockTransfers.push(newTransfer);
      return Promise.resolve(newTransfer);
    },
    findByIdAndUpdate: (id, data) => {
      console.log('📊 Mock: Updating stock transfer:', id, data);
      const index = mockData.stockTransfers.findIndex(t => t._id === id);
      if (index !== -1) {
        mockData.stockTransfers[index] = { ...mockData.stockTransfers[index], ...data, updatedAt: new Date() };
        return Promise.resolve(mockData.stockTransfers[index]);
      }
      return Promise.resolve(null);
    }
  },

  // Repacking operations
  repackings: {
    find: (query = {}) => {
      console.log('📊 Mock: Finding repackings with query:', query);
      return Promise.resolve(mockData.repackings);
    },
    findById: (id) => {
      console.log('📊 Mock: Finding repacking by ID:', id);
      return Promise.resolve(mockData.repackings.find(r => r._id === id) || null);
    },
    create: (data) => {
      console.log('📊 Mock: Creating repacking:', data);
      const newRepacking = {
        _id: `mock-repacking-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockData.repackings.push(newRepacking);
      return Promise.resolve(newRepacking);
    },
    findByIdAndUpdate: (id, data) => {
      console.log('📊 Mock: Updating repacking:', id, data);
      const index = mockData.repackings.findIndex(r => r._id === id);
      if (index !== -1) {
        mockData.repackings[index] = { ...mockData.repackings[index], ...data, updatedAt: new Date() };
        return Promise.resolve(mockData.repackings[index]);
      }
      return Promise.resolve(null);
    }
  },

  // Production Cost operations
  productionCosts: {
    find: (query = {}) => {
      console.log('📊 Mock: Finding production costs with query:', query);
      return Promise.resolve(mockData.productionCosts);
    },
    findById: (id) => {
      console.log('📊 Mock: Finding production cost by ID:', id);
      return Promise.resolve(mockData.productionCosts.find(p => p._id === id) || null);
    },
    create: (data) => {
      console.log('📊 Mock: Creating production cost:', data);
      const newCost = {
        _id: `mock-cost-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockData.productionCosts.push(newCost);
      return Promise.resolve(newCost);
    }
  }
};

// Function to get mock data
export const getMockData = () => {
  return mockData;
};

// Function to reset mock data
export const resetMockData = () => {
  console.log('🔄 Resetting mock data');
  // Reset to initial state
  mockData.customers = [mockData.customers[0]]; // Keep one sample
  mockData.stockTransfers = [mockData.stockTransfers[0]]; // Keep one sample
  mockData.repackings = [mockData.repackings[0]]; // Keep one sample
  mockData.productionCosts = [mockData.productionCosts[0]]; // Keep one sample
};

export default {
  enableOfflineMode,
  disableOfflineMode,
  isOfflineModeEnabled,
  mockDatabase,
  getMockData,
  resetMockData
};

