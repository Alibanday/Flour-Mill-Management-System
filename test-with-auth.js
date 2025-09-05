// Test Script with Authentication for Flour Mill Management System
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:7000/api';
let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test helper function
async function testEndpoint(name, method, endpoint, data = null, expectedStatus = 200, useAuth = false) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (useAuth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = {
      name,
      method,
      endpoint,
      status: response.status,
      expectedStatus,
      success: response.status === expectedStatus,
      response: response.status < 400 ? await response.json() : await response.text()
    };
    
    if (result.success) {
      testResults.passed++;
      console.log(`✅ ${name}: PASSED (${response.status})`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name}: FAILED (${response.status}) - Expected: ${expectedStatus}`);
    }
    
    testResults.tests.push(result);
    return result;
  } catch (error) {
    testResults.failed++;
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    testResults.tests.push({
      name,
      method,
      endpoint,
      error: error.message,
      success: false
    });
    return null;
  }
}

// Test authentication and get token
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Test login with demo credentials
  const loginData = {
    email: 'admin@example.com',
    password: 'test1234'
  };
  
  const loginResult = await testEndpoint('Admin Login', 'POST', '/auth/login', loginData, 200);
  
  if (loginResult && loginResult.success && loginResult.response.token) {
    authToken = loginResult.response.token;
    console.log('🔑 Authentication token obtained successfully');
    return true;
  } else {
    console.log('❌ Failed to obtain authentication token');
    return false;
  }
}

// Test User Management with Authentication
async function testUserManagementWithAuth() {
  console.log('\n👥 Testing User Management Module (FR 01-06)...');
  
  if (!authToken) {
    console.log('❌ No authentication token available');
    return;
  }
  
  // Test get users with auth
  await testEndpoint('Get Users (With Auth)', 'GET', '/users/all', null, 200, true);
  
  // Test create user with auth
  const userData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    role: 'Employee',
    warehouse: '507f1f77bcf86cd799439011', // Sample warehouse ID
    cnic: '12345-1234567-1',
    address: 'Test Address',
    mobile: '03001234567'
  };
  
  await testEndpoint('Create User (With Auth)', 'POST', '/users/create', userData, 201, true);
}

// Test Warehouse Management with Authentication
async function testWarehouseManagementWithAuth() {
  console.log('\n🏢 Testing Warehouse Management Module (FR 07-13)...');
  
  if (!authToken) {
    console.log('❌ No authentication token available');
    return;
  }
  
  // Test get warehouses with auth
  await testEndpoint('Get Warehouses (With Auth)', 'GET', '/warehouses/all', null, 200, true);
  
  // Test create warehouse with auth
  const warehouseData = {
    warehouseNumber: 'WH002',
    warehouseName: 'Test Warehouse 2',
    location: {
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Pakistan'
    },
    status: 'Active',
    description: 'Test warehouse for testing'
  };
  
  await testEndpoint('Create Warehouse (With Auth)', 'POST', '/warehouses/create', warehouseData, 201, true);
}

// Test Inventory Management with Authentication
async function testInventoryManagementWithAuth() {
  console.log('\n📦 Testing Inventory Management Module (FR 07-13)...');
  
  if (!authToken) {
    console.log('❌ No authentication token available');
    return;
  }
  
  // Test get inventory with auth
  await testEndpoint('Get Inventory (With Auth)', 'GET', '/inventory/all', null, 200, true);
  
  // Test create inventory with auth
  const inventoryData = {
    name: 'Test Flour',
    code: 'TF001',
    category: 'Finished Goods',
    description: 'Test flour for testing',
    unit: 'kg',
    currentStock: 100,
    minimumStock: 10,
    maximumStock: 1000,
    reorderPoint: 20,
    cost: {
      purchasePrice: 50,
      currency: 'PKR'
    },
    warehouse: '507f1f77bcf86cd799439011', // Sample warehouse ID
    location: {
      aisle: 'A1',
      shelf: 'S1',
      bin: 'B1'
    },
    status: 'Active'
  };
  
  await testEndpoint('Create Inventory (With Auth)', 'POST', '/inventory/create', inventoryData, 201, true);
}

// Test Production Management with Authentication
async function testProductionManagementWithAuth() {
  console.log('\n🏭 Testing Production Management Module (FR 14-18)...');
  
  if (!authToken) {
    console.log('❌ No authentication token available');
    return;
  }
  
  // Test get production with auth
  await testEndpoint('Get Production (With Auth)', 'GET', '/production', null, 200, true);
  
  // Test create production with auth
  const productionData = {
    batchNumber: 'BATCH001',
    productName: 'Wheat Flour',
    productType: 'Finished Goods',
    productionDate: new Date(),
    quantity: {
      value: 100,
      unit: 'kg'
    },
    productionCost: {
      rawMaterialCost: 1000,
      laborCost: 500,
      overheadCost: 200,
      totalCost: 1700,
      currency: 'PKR'
    },
    warehouse: '507f1f77bcf86cd799439011', // Sample warehouse ID
    addedBy: '507f1f77bcf86cd799439011', // Sample user ID
    status: 'Completed'
  };
  
  await testEndpoint('Create Production (With Auth)', 'POST', '/production', productionData, 201, true);
}

// Test Sales Management with Authentication
async function testSalesManagementWithAuth() {
  console.log('\n💰 Testing Sales Management Module (FR 19-24)...');
  
  if (!authToken) {
    console.log('❌ No authentication token available');
    return;
  }
  
  // Test get sales with auth
  await testEndpoint('Get Sales (With Auth)', 'GET', '/sales', null, 200, true);
  
  // Test create sale with auth
  const saleData = {
    invoiceNumber: 'INV001',
    customer: {
      name: 'Test Customer',
      contact: {
        phone: '03001234567',
        email: 'customer@example.com',
        address: 'Customer Address'
      },
      creditLimit: 10000,
      outstandingBalance: 0
    },
    saleDate: new Date(),
    items: [{
      product: '507f1f77bcf86cd799439011', // Sample product ID
      productName: 'Test Flour',
      quantity: 10,
      unit: 'kg',
      unitPrice: 50,
      totalPrice: 500
    }],
    subtotal: 500,
    discount: {
      type: 'percentage',
      value: 10,
      amount: 50
    },
    totalAmount: 450,
    paymentStatus: 'paid',
    paymentMethod: 'Cash',
    warehouse: '507f1f77bcf86cd799439011', // Sample warehouse ID
    createdBy: '507f1f77bcf86cd799439011' // Sample user ID
  };
  
  await testEndpoint('Create Sale (With Auth)', 'POST', '/sales', saleData, 201, true);
}

// Test Reports with Authentication
async function testReportsWithAuth() {
  console.log('\n📊 Testing Reports Module (FR 35-41)...');
  
  if (!authToken) {
    console.log('❌ No authentication token available');
    return;
  }
  
  // Test get reports with auth
  await testEndpoint('Get Reports (With Auth)', 'GET', '/reports', null, 200, true);
  
  // Test generate sales report with auth
  const reportData = {
    reportType: 'sales',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    filters: {}
  };
  
  await testEndpoint('Generate Sales Report (With Auth)', 'POST', '/reports/sales', reportData, 200, true);
}

// Main test function
async function runAuthenticatedTests() {
  console.log('🚀 Starting Authenticated System Tests...');
  console.log('=' * 60);
  
  // Test authentication first
  const authSuccess = await testAuthentication();
  
  if (!authSuccess) {
    console.log('❌ Authentication failed. Cannot proceed with authenticated tests.');
    return;
  }
  
  // Run authenticated tests
  await testUserManagementWithAuth();
  await testWarehouseManagementWithAuth();
  await testInventoryManagementWithAuth();
  await testProductionManagementWithAuth();
  await testSalesManagementWithAuth();
  await testReportsWithAuth();
  
  // Print summary
  console.log('\n' + '=' * 60);
  console.log('📋 AUTHENTICATED TEST SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL AUTHENTICATED TESTS PASSED! System is working correctly with authentication.');
  } else {
    console.log('\n⚠️ Some authenticated tests failed. Check the details above.');
  }
  
  return testResults;
}

// Run tests
runAuthenticatedTests().catch(console.error);
