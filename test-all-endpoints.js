const axios = require('axios');

const BASE_URL = 'http://localhost:7000';

async function testAllEndpoints() {
  console.log('🧪 Testing all API endpoints...');
  
  const endpoints = [
    { method: 'GET', url: '/api/health', auth: false },
    { method: 'GET', url: '/api/notifications', auth: true },
    { method: 'GET', url: '/api/notifications/stats', auth: true },
    { method: 'GET', url: '/api/sales', auth: true },
    { method: 'GET', url: '/api/purchases', auth: true },
    { method: 'GET', url: '/api/inventory', auth: true },
    { method: 'GET', url: '/api/warehouses', auth: true },
    { method: 'GET', url: '/api/suppliers', auth: true },
    { method: 'GET', url: '/api/customers', auth: true },
    { method: 'GET', url: '/api/production', auth: true },
    { method: 'GET', url: '/api/financial/accounts', auth: true },
    { method: 'GET', url: '/api/financial/transactions', auth: true },
    { method: 'GET', url: '/api/financial/salaries', auth: true },
    { method: 'GET', url: '/api/reports/sales', auth: true },
    { method: 'GET', url: '/api/gate-pass', auth: true },
    { method: 'GET', url: '/api/bag-purchases', auth: true },
    { method: 'GET', url: '/api/food-purchases', auth: true }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        headers: {}
      };

      if (endpoint.auth) {
        // Use a mock token for testing
        config.headers.Authorization = 'Bearer mock-token-for-testing';
      }

      const response = await axios(config);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ ${endpoint.method} ${endpoint.url} - ${response.status}`);
        passed++;
      } else {
        console.log(`⚠️ ${endpoint.method} ${endpoint.url} - ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.url} - ${error.response?.status || 'ERROR'}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
}

testAllEndpoints().catch(console.error);
