// Simple test script to verify the API is working
const testCustomerCreation = async () => {
  try {
    console.log('🧪 Testing Customer Creation API...');
    
    const response = await fetch('http://localhost:7000/api/customers/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@test.com',
        phone: '1234567890'
      })
    });
    
    const result = await response.text();
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Body:', result);
    
    if (response.ok) {
      console.log('✅ Customer creation successful!');
    } else {
      console.log('❌ Customer creation failed');
    }
    
  } catch (error) {
    console.log('❌ Error testing customer creation:', error.message);
  }
};

// Test notification API
const testNotificationAPI = async () => {
  try {
    console.log('\n🔔 Testing Notification API...');
    
    const response = await fetch('http://localhost:7000/api/notifications/stats');
    const result = await response.text();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Body:', result);
    
    if (response.ok) {
      console.log('✅ Notification API working!');
    } else {
      console.log('❌ Notification API failed');
    }
    
  } catch (error) {
    console.log('❌ Error testing notification API:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  
  await testCustomerCreation();
  await testNotificationAPI();
  
  console.log('\n🏁 Tests completed!');
};

runTests();
