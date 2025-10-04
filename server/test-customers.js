import mongoose from 'mongoose';
import Customer from './model/Customer.js';

// Test customer data
const testCustomers = [
  {
    firstName: 'Ahmed',
    lastName: 'Khan',
    email: 'ahmed.khan@example.com',
    phone: '+92-300-1234567',
    businessName: 'Khan Flour Store',
    businessType: 'Retailer',
    customerType: 'Regular',
    status: 'Active'
  },
  {
    firstName: 'Fatima',
    lastName: 'Ali',
    email: 'fatima.ali@example.com',
    phone: '+92-301-2345678',
    businessName: 'Ali Bakery',
    businessType: 'Bakery',
    customerType: 'Premium',
    status: 'Active'
  },
  {
    firstName: 'Muhammad',
    lastName: 'Hassan',
    email: 'm.hassan@example.com',
    phone: '+92-302-3456789',
    businessName: 'Hassan Distributors',
    businessType: 'Distributor',
    customerType: 'VIP',
    status: 'Active'
  },
  {
    firstName: 'Aisha',
    lastName: 'Malik',
    email: 'aisha.malik@example.com',
    phone: '+92-303-4567890',
    businessName: 'Malik Restaurant',
    businessType: 'Restaurant',
    customerType: 'Regular',
    status: 'Active'
  },
  {
    firstName: 'Omar',
    lastName: 'Sheikh',
    email: 'omar.sheikh@example.com',
    phone: '+92-304-5678901',
    businessName: 'Sheikh Wholesale',
    businessType: 'Wholesaler',
    customerType: 'Premium',
    status: 'Active'
  }
];

async function createTestCustomers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://flourmill:flourmill123@cluster0.8jqjq.mongodb.net/flourmill?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Clear existing test customers
    await Customer.deleteMany({ email: { $regex: /@example\.com$/ } });
    console.log('Cleared existing test customers');

    // Create test customers
    const createdCustomers = [];
    for (const customerData of testCustomers) {
      const customer = new Customer(customerData);
      await customer.save();
      createdCustomers.push(customer);
      console.log(`Created customer: ${customer.firstName} ${customer.lastName}`);
    }

    console.log(`\n✅ Successfully created ${createdCustomers.length} test customers!`);
    console.log('\nTest customers:');
    createdCustomers.forEach(customer => {
      console.log(`- ${customer.firstName} ${customer.lastName} (${customer.email}) - ${customer.businessName}`);
    });

  } catch (error) {
    console.error('Error creating test customers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
createTestCustomers();
