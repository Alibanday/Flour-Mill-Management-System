// API Integration Test Utility
import api, { API_ENDPOINTS } from '../services/api';

export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await api.get('/api/health');
    console.log('✅ API Health Check:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API Health Check Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const testAuthentication = async (email, password) => {
  try {
    console.log('Testing authentication...');
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    console.log('✅ Authentication Test:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Authentication Test Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const testWarehouseAPI = async () => {
  try {
    console.log('Testing Warehouse API...');
    const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_ALL);
    console.log('✅ Warehouse API Test:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Warehouse API Test Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const testInventoryAPI = async () => {
  try {
    console.log('Testing Inventory API...');
    const response = await api.get(API_ENDPOINTS.INVENTORY.GET_ALL);
    console.log('✅ Inventory API Test:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Inventory API Test Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const runAllTests = async () => {
  console.log('🚀 Starting API Integration Tests...');
  
  const results = {
    health: await testApiConnection(),
    warehouse: await testWarehouseAPI(),
    inventory: await testInventoryAPI()
  };

  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n📊 Test Results: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All API tests passed!');
  } else {
    console.log('⚠️ Some API tests failed. Check the logs above.');
  }

  return results;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.apiTest = {
    testApiConnection,
    testAuthentication,
    testWarehouseAPI,
    testInventoryAPI,
    runAllTests
  };
}

