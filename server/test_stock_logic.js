import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import Product from './model/Product.js';
import Inventory from './model/inventory.js';
import Stock from './model/stock.js';
import Warehouse from './model/wareHouse.js';

async function runTest() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Create Test Warehouse
        console.log('\n🏭 Creating/Finding Test Warehouse...');
        let warehouse = await Warehouse.findOne({ name: 'Test Warehouse Logic' });
        if (!warehouse) {
            warehouse = new Warehouse({
                name: 'Test Warehouse Logic',
                location: 'Test Location',
                capacity: { totalCapacity: 1000, unit: 'tons' }
            });
            await warehouse.save();
            console.log('✅ Created Test Warehouse:', warehouse._id);
        } else {
            console.log('✅ Found Test Warehouse:', warehouse._id);
        }

        // 2. Create Test Product
        console.log('\n📦 Creating/Finding Test Product...');
        let product = await Product.findOne({ name: 'Test Wheat' });
        if (!product) {
            product = new Product({
                name: 'Test Wheat',
                code: 'TEST-WHEAT',
                category: 'Raw Materials',
                subcategory: 'Grains',
                unit: 'kg',
                purchasePrice: 50,
                salePrice: 60,
                minimumStock: 10,
                weightVariants: [{ weight: 50, price: 2500 }]
            });
            await product.save();
            console.log('✅ Created Test Product:', product._id);
        } else {
            console.log('✅ Found Test Product:', product._id);
        }

        // 3. Clean up existing inventory/stock for this test
        console.log('\n🧹 Cleaning up old test data...');
        await Inventory.deleteMany({ product: product._id, warehouse: warehouse._id });
        await Stock.deleteMany({ reason: { $regex: /Test Logic/ } });

        // 4. Create Initial Inventory (Empty)
        console.log('\n📝 Creating Initial Inventory (0 stock)...');
        let inventory = new Inventory({
            product: product._id,
            warehouse: warehouse._id,
            currentStock: 0,
            status: 'Active'
        });
        await inventory.save();
        console.log('✅ Inventory created. Current Stock:', inventory.currentStock);

        // 5. Test Stock IN (Purchase)
        console.log('\n➕ Testing Stock IN (Purchase 100kg)...');
        const stockIn = new Stock({
            inventoryItem: inventory._id,
            movementType: 'in',
            quantity: 100,
            reason: 'Test Logic - Purchase',
            warehouse: warehouse._id
        });
        await stockIn.save();
        console.log('✅ Stock IN saved.');

        // Verify Inventory Update
        inventory = await Inventory.findById(inventory._id);
        console.log('🔍 Inventory Stock after IN:', inventory.currentStock);
        if (inventory.currentStock === 100) {
            console.log('✅ SUCCESS: Stock IN updated inventory correctly.');
        } else {
            console.error('❌ FAILURE: Stock IN did not update inventory correctly.');
        }

        // 6. Test Stock OUT (Sale)
        console.log('\n➖ Testing Stock OUT (Sale 30kg)...');
        const stockOut = new Stock({
            inventoryItem: inventory._id,
            movementType: 'out',
            quantity: 30,
            reason: 'Test Logic - Sale',
            warehouse: warehouse._id
        });
        await stockOut.save();
        console.log('✅ Stock OUT saved.');

        // Verify Inventory Update
        inventory = await Inventory.findById(inventory._id);
        console.log('🔍 Inventory Stock after OUT:', inventory.currentStock);
        if (inventory.currentStock === 70) {
            console.log('✅ SUCCESS: Stock OUT updated inventory correctly.');
        } else {
            console.error('❌ FAILURE: Stock OUT did not update inventory correctly.');
        }

        // 7. Test Warehouse Capacity Update
        const updatedWarehouse = await Warehouse.findById(warehouse._id);
        console.log('\n🏭 Warehouse Capacity Usage:', updatedWarehouse.capacity.currentUsage);

    } catch (error) {
        console.error('❌ Test Failed:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected.');
    }
}

runTest();
