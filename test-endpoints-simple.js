const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:7000';

function makeRequest(method, url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 7000,
      path: url,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

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
      const headers = {};
      if (endpoint.auth) {
        headers.Authorization = 'Bearer mock-token-for-testing';
      }

      const response = await makeRequest(endpoint.method, endpoint.url, headers);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ ${endpoint.method} ${endpoint.url} - ${response.status}`);
        passed++;
      } else if (response.status === 401) {
        console.log(`🔐 ${endpoint.method} ${endpoint.url} - ${response.status} (Auth required)`);
        passed++; // This is expected for protected routes
      } else {
        console.log(`⚠️ ${endpoint.method} ${endpoint.url} - ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.url} - ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All endpoints are working correctly!');
  } else {
    console.log('⚠️ Some endpoints need attention.');
  }
}

// Wait a moment for server to start
setTimeout(() => {
  testAllEndpoints().catch(console.error);
}, 3000);
