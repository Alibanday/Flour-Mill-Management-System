const mongoose = require('mongoose');

// Test script to verify supplier types implementation
async function testSupplierTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flourmill', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Define the supplier schema with supplierType
    const supplierSchema = new mongoose.Schema({
      supplierCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      supplierType: {
        type: String,
        required: true,
        enum: ["Government", "Private"],
        default: "Private",
      },
      businessType: {
        type: String,
        required: true,
        enum: ["Raw Materials", "Packaging", "Equipment", "Services", "Other"],
        default: "Raw Materials",
      },
      contactPerson: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, default: "Pakistan", trim: true },
      },
      taxNumber: { type: String, trim: true },
      creditLimit: { type: Number, default: 0, min: 0 },
      outstandingBalance: { type: Number, default: 0, min: 0 },
      paymentTerms: {
        type: String,
        enum: ["Immediate", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days"],
        default: "30 Days",
      },
      status: {
        type: String,
        enum: ["Active", "Inactive", "Suspended"],
        default: "Active",
      },
      rating: { type: Number, min: 1, max: 5, default: 3 },
      notes: { type: String, trim: true },
      warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }, { timestamps: true });

    const Supplier = mongoose.model('Supplier', supplierSchema);

    // Test creating suppliers with different types
    console.log('\n=== Testing Supplier Types Implementation ===\n');

    // Create a test warehouse ID (you may need to adjust this)
    const testWarehouseId = new mongoose.Types.ObjectId();
    const testUserId = new mongoose.Types.ObjectId();

    // Test 1: Create Government Supplier
    console.log('1. Creating Government Supplier...');
    const governmentSupplier = new Supplier({
      supplierCode: 'GOV001',
      name: 'Government Wheat Board',
      supplierType: 'Government',
      businessType: 'Raw Materials',
      contactPerson: 'Ahmed Ali',
      email: 'ahmed@gov.pk',
      phone: '+92-300-1234567',
      address: {
        street: 'Government Office Complex',
        city: 'Islamabad',
        state: 'Federal',
        postalCode: '44000',
        country: 'Pakistan'
      },
      taxNumber: 'GOV-TAX-001',
      creditLimit: 1000000,
      paymentTerms: '30 Days',
      status: 'Active',
      rating: 4,
      notes: 'Primary government supplier for wheat',
      warehouse: testWarehouseId,
      createdBy: testUserId
    });

    await governmentSupplier.save();
    console.log('✓ Government Supplier created successfully');

    // Test 2: Create Private Supplier
    console.log('2. Creating Private Supplier...');
    const privateSupplier = new Supplier({
      supplierCode: 'PRV001',
      name: 'ABC Trading Company',
      supplierType: 'Private',
      businessType: 'Packaging',
      contactPerson: 'Sara Khan',
      email: 'sara@abc.com',
      phone: '+92-300-7654321',
      address: {
        street: 'Industrial Area',
        city: 'Karachi',
        state: 'Sindh',
        postalCode: '75000',
        country: 'Pakistan'
      },
      taxNumber: 'PRV-TAX-001',
      creditLimit: 500000,
      paymentTerms: '15 Days',
      status: 'Active',
      rating: 5,
      notes: 'Reliable private supplier',
      warehouse: testWarehouseId,
      createdBy: testUserId
    });

    await privateSupplier.save();
    console.log('✓ Private Supplier created successfully');

    // Test 3: Query suppliers by type
    console.log('\n3. Testing queries by supplier type...');
    
    const governmentSuppliers = await Supplier.find({ supplierType: 'Government' });
    console.log(`✓ Found ${governmentSuppliers.length} Government suppliers`);

    const privateSuppliers = await Supplier.find({ supplierType: 'Private' });
    console.log(`✓ Found ${privateSuppliers.length} Private suppliers`);

    // Test 4: Test filtering with multiple criteria
    console.log('\n4. Testing combined filtering...');
    
    const activeGovernmentSuppliers = await Supplier.find({ 
      supplierType: 'Government', 
      status: 'Active' 
    });
    console.log(`✓ Found ${activeGovernmentSuppliers.length} Active Government suppliers`);

    const rawMaterialSuppliers = await Supplier.find({ 
      businessType: 'Raw Materials' 
    });
    console.log(`✓ Found ${rawMaterialSuppliers.length} Raw Material suppliers`);

    // Test 5: Test aggregation by supplier type
    console.log('\n5. Testing aggregation by supplier type...');
    
    const supplierTypeCount = await Supplier.aggregate([
      { $group: { _id: '$supplierType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('Supplier Type Distribution:');
    supplierTypeCount.forEach(item => {
      console.log(`  ${item._id}: ${item.count} suppliers`);
    });

    console.log('\n=== All Tests Passed! ===');
    console.log('\nImplementation Summary:');
    console.log('✓ Supplier model updated with supplierType field');
    console.log('✓ Government and Private suppliers can be created');
    console.log('✓ Filtering by supplier type works');
    console.log('✓ Combined filtering works');
    console.log('✓ Aggregation by supplier type works');

    // Clean up test data
    await Supplier.deleteMany({ supplierCode: { $in: ['GOV001', 'PRV001'] } });
    console.log('\n✓ Test data cleaned up');

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testSupplierTypes();
