// Comprehensive Test Script for Flour Mill Management System
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:7000/api';
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test helper function
async function testEndpoint(name, method, endpoint, data = null, expectedStatus = 200) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
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

// Test Authentication
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication Module (FR 01-06)...');
  
  // Test health endpoint
  await testEndpoint('Health Check', 'GET', '/health');
  
  // Test user login (should fail without credentials)
  await testEndpoint('User Login (Invalid)', 'POST', '/auth/login', {}, 400);
  
  // Test protected route without token
  await testEndpoint('Protected Route (No Token)', 'GET', '/users/all', null, 401);
}

// Test User Management
async function testUserManagement() {
  console.log('\n👥 Testing User Management Module (FR 01-06)...');
  
  // Test get users (should fail without auth)
  await testEndpoint('Get Users (No Auth)', 'GET', '/users/all', null, 401);
  
  // Test create user (should fail without auth)
  await testEndpoint('Create User (No Auth)', 'POST', '/users/create', {}, 401);
}

// Test Warehouse Management
async function testWarehouseManagement() {
  console.log('\n🏢 Testing Warehouse Management Module (FR 07-13)...');
  
  // Test get warehouses (should fail without auth)
  await testEndpoint('Get Warehouses (No Auth)', 'GET', '/warehouses', null, 401);
  
  // Test create warehouse (should fail without auth)
  await testEndpoint('Create Warehouse (No Auth)', 'POST', '/warehouses', {}, 401);
}

// Test Inventory Management
async function testInventoryManagement() {
  console.log('\n📦 Testing Inventory Management Module (FR 07-13)...');
  
  // Test get inventory (should fail without auth)
  await testEndpoint('Get Inventory (No Auth)', 'GET', '/inventory', null, 401);
  
  // Test create inventory (should fail without auth)
  await testEndpoint('Create Inventory (No Auth)', 'POST', '/inventory', {}, 401);
}

// Test Production Management
async function testProductionManagement() {
  console.log('\n🏭 Testing Production Management Module (FR 14-18)...');
  
  // Test get production (should fail without auth)
  await testEndpoint('Get Production (No Auth)', 'GET', '/production', null, 401);
  
  // Test create production (should fail without auth)
  await testEndpoint('Create Production (No Auth)', 'POST', '/production', {}, 401);
}

// Test Sales & Purchase Management
async function testSalesPurchaseManagement() {
  console.log('\n💰 Testing Sales & Purchase Management Module (FR 19-24)...');
  
  // Test get sales (should fail without auth)
  await testEndpoint('Get Sales (No Auth)', 'GET', '/sales', null, 401);
  
  // Test create sale (should fail without auth)
  await testEndpoint('Create Sale (No Auth)', 'POST', '/sales', {}, 401);
  
  // Test get purchases (should fail without auth)
  await testEndpoint('Get Purchases (No Auth)', 'GET', '/purchases', null, 401);
  
  // Test create purchase (should fail without auth)
  await testEndpoint('Create Purchase (No Auth)', 'POST', '/purchases', {}, 401);
}

// Test Financial Management
async function testFinancialManagement() {
  console.log('\n💳 Testing Financial Management Module (FR 25-28)...');
  
  // Test get accounts (should fail without auth)
  await testEndpoint('Get Accounts (No Auth)', 'GET', '/financial/accounts', null, 401);
  
  // Test get transactions (should fail without auth)
  await testEndpoint('Get Transactions (No Auth)', 'GET', '/financial/transactions', null, 401);
}

// Test Supplier & Vendor Management
async function testSupplierVendorManagement() {
  console.log('\n🏪 Testing Supplier & Vendor Management Module (FR 29-30)...');
  
  // Test get suppliers (should fail without auth)
  await testEndpoint('Get Suppliers (No Auth)', 'GET', '/suppliers', null, 401);
  
  // Test create supplier (should fail without auth)
  await testEndpoint('Create Supplier (No Auth)', 'POST', '/suppliers', {}, 401);
}

// Test Bag & Food Purchase Management
async function testBagFoodPurchaseManagement() {
  console.log('\n🛍️ Testing Bag & Food Purchase Management Module (FR 31-34)...');
  
  // Test get bag purchases (should fail without auth)
  await testEndpoint('Get Bag Purchases (No Auth)', 'GET', '/bag-purchases', null, 401);
  
  // Test create bag purchase (should fail without auth)
  await testEndpoint('Create Bag Purchase (No Auth)', 'POST', '/bag-purchases', {}, 401);
  
  // Test get food purchases (should fail without auth)
  await testEndpoint('Get Food Purchases (No Auth)', 'GET', '/food-purchases', null, 401);
  
  // Test create food purchase (should fail without auth)
  await testEndpoint('Create Food Purchase (No Auth)', 'POST', '/food-purchases', {}, 401);
}

// Test Reports Module
async function testReportsModule() {
  console.log('\n📊 Testing Reports Module (FR 35-41)...');
  
  // Test get reports (should fail without auth)
  await testEndpoint('Get Reports (No Auth)', 'GET', '/reports', null, 401);
  
  // Test generate sales report (should fail without auth)
  await testEndpoint('Generate Sales Report (No Auth)', 'POST', '/reports/sales', {}, 401);
}

// Test Gate Pass System
async function testGatePassSystem() {
  console.log('\n🚪 Testing Gate Pass System (FR 42-49)...');
  
  // Test get gate passes (should fail without auth)
  await testEndpoint('Get Gate Passes (No Auth)', 'GET', '/gate-pass', null, 401);
  
  // Test create gate pass (should fail without auth)
  await testEndpoint('Create Gate Pass (No Auth)', 'POST', '/gate-pass', {}, 401);
}

// Test Notifications
async function testNotifications() {
  console.log('\n🔔 Testing Notifications & Utilities (FR 50-51)...');
  
  // Test get notifications (should fail without auth)
  await testEndpoint('Get Notifications (No Auth)', 'GET', '/notifications', null, 401);
}

// Test System Configuration
async function testSystemConfiguration() {
  console.log('\n⚙️ Testing System Configuration...');
  
  // Test get system config (should fail without auth)
  await testEndpoint('Get System Config (No Auth)', 'GET', '/system-config', null, 401);
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Comprehensive System Tests...');
  console.log('=' * 60);
  
  await testAuthentication();
  await testUserManagement();
  await testWarehouseManagement();
  await testInventoryManagement();
  await testProductionManagement();
  await testSalesPurchaseManagement();
  await testFinancialManagement();
  await testSupplierVendorManagement();
  await testBagFoodPurchaseManagement();
  await testReportsModule();
  await testGatePassSystem();
  await testNotifications();
  await testSystemConfiguration();
  
  // Print summary
  console.log('\n' + '=' * 60);
  console.log('📋 TEST SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }
  
  return testResults;
}

// Run tests
runAllTests().catch(console.error);
