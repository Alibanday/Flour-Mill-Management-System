import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyWheatPurchaseFlow() {
    try {
        console.log('='.repeat(60));
        console.log('WHEAT PURCHASE FLOW VERIFICATION TEST');
        console.log('='.repeat(60));

        console.log('\n[1/6] Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Import models
        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;
        const Warehouse = (await import('./model/wareHouse.js')).default;
        const User = (await import('./model/user.js')).default;
        const Product = (await import('./model/Product.js')).default;

        console.log('[2/6] Setting up test environment...');

        // Get or create test warehouse
        let warehouse = await Warehouse.findOne({ name: 'Wheat Test Warehouse' });
        if (!warehouse) {
            warehouse = new Warehouse({
                name: 'Wheat Test Warehouse',
                location: 'Test Location',
                capacity: {
                    totalCapacity: 10000,
                    unit: '50kg bags',
                    currentUsage: 0
                },
                status: 'Active'
            });
            await warehouse.save();
            console.log('  ✅ Created test warehouse:', warehouse.name);
        } else {
            console.log('  ✅ Using existing warehouse:', warehouse.name);
        }

        // Get a user for audit trail
        const user = await User.findOne({ role: 'Admin' }) || await User.findOne();
        const userId = user ? user._id : new mongoose.Types.ObjectId();
        console.log('  ✅ Using user ID:', userId);

        // Clean up any existing wheat inventory for this warehouse
        await Inventory.deleteMany({
            name: { $regex: /^wheat$/i },
            warehouse: warehouse._id
        });
        console.log('  ✅ Cleaned up existing wheat inventory\n');

        // Check if Wheat product exists in catalog
        const wheatProduct = await Product.findOne({ name: { $regex: /^wheat$/i } });
        if (wheatProduct) {
            console.log('  ℹ️  Wheat product EXISTS in Product Catalog (ID:', wheatProduct._id, ')');
        } else {
            console.log('  ℹ️  Wheat product DOES NOT EXIST in Product Catalog');
        }
        console.log('  ℹ️  This test verifies purchases work WITHOUT requiring Product Catalog\n');

        // TEST 1: First Purchase - Create Inventory
        console.log('[3/6] TEST 1: First wheat purchase (should create inventory)...');
        const purchase1Quantity = 100;
        const purchase1Ref = `TEST-WP-${Date.now()}-1`;

        let inventoryItem = await Inventory.findOne({
            name: { $regex: new RegExp(`^Wheat$`, 'i') },
            warehouse: warehouse._id
        });

        if (!inventoryItem) {
            inventoryItem = new Inventory({
                name: 'Wheat',
                warehouse: warehouse._id,
                currentStock: 0,
                minimumStock: 100,
                status: 'Active',
                category: 'Raw Materials',
                subcategory: 'Grains',
                unit: 'kg',
                price: 60
            });
            await inventoryItem.save();
            console.log('  ✅ Created new inventory item (ID:', inventoryItem._id, ')');
        }

        const stockIn1 = new Stock({
            inventoryItem: inventoryItem._id,
            movementType: 'in',
            quantity: purchase1Quantity,
            reason: `Food Purchase - ${purchase1Ref}`,
            referenceNumber: purchase1Ref,
            warehouse: warehouse._id,
            createdBy: userId
        });
        await stockIn1.save();
        console.log('  ✅ Created stock movement: +', purchase1Quantity, 'kg');

        // Verify inventory updated
        let updatedInventory = await Inventory.findById(inventoryItem._id);
        console.log('  📊 Expected stock:', purchase1Quantity, 'kg');
        console.log('  📊 Actual stock:  ', updatedInventory.currentStock, 'kg');

        if (updatedInventory.currentStock === purchase1Quantity) {
            console.log('  ✅ TEST 1 PASSED: Inventory created and stock updated correctly\n');
        } else {
            console.log('  ❌ TEST 1 FAILED: Stock mismatch!\n');
            throw new Error('Test 1 failed');
        }

        // TEST 2: Second Purchase - Aggregate Stock
        console.log('[4/6] TEST 2: Second wheat purchase (should aggregate stock)...');
        const purchase2Quantity = 75;
        const purchase2Ref = `TEST-WP-${Date.now()}-2`;

        const stockIn2 = new Stock({
            inventoryItem: inventoryItem._id,
            movementType: 'in',
            quantity: purchase2Quantity,
            reason: `Food Purchase - ${purchase2Ref}`,
            referenceNumber: purchase2Ref,
            warehouse: warehouse._id,
            createdBy: userId
        });
        await stockIn2.save();
        console.log('  ✅ Created stock movement: +', purchase2Quantity, 'kg');

        // Verify aggregation
        updatedInventory = await Inventory.findById(inventoryItem._id);
        const expectedTotal = purchase1Quantity + purchase2Quantity;
        console.log('  📊 Expected stock:', expectedTotal, 'kg (', purchase1Quantity, '+', purchase2Quantity, ')');
        console.log('  📊 Actual stock:  ', updatedInventory.currentStock, 'kg');

        if (updatedInventory.currentStock === expectedTotal) {
            console.log('  ✅ TEST 2 PASSED: Stock aggregated correctly\n');
        } else {
            console.log('  ❌ TEST 2 FAILED: Stock aggregation error!\n');
            throw new Error('Test 2 failed');
        }

        // TEST 3: Verify No Product Catalog Dependency
        console.log('[5/6] TEST 3: Verify inventory works without Product reference...');
        console.log('  📊 Inventory.product field:', updatedInventory.product || 'null/undefined');
        console.log('  📊 Inventory.name field:   ', updatedInventory.name);
        console.log('  📊 Inventory.category:     ', updatedInventory.category);

        if (!updatedInventory.product) {
            console.log('  ✅ TEST 3 PASSED: Inventory works without Product Catalog reference\n');
        } else {
            console.log('  ⚠️  TEST 3 WARNING: Inventory has Product reference (not required but acceptable)\n');
        }

        // TEST 4: Verify Stock Movements
        console.log('[6/6] TEST 4: Verify stock movement history...');
        const stockMovements = await Stock.find({
            inventoryItem: inventoryItem._id,
            warehouse: warehouse._id
        }).sort({ createdAt: 1 });

        console.log('  📊 Total stock movements:', stockMovements.length);
        stockMovements.forEach((movement, idx) => {
            console.log(`  📦 Movement ${idx + 1}: ${movement.movementType} ${movement.quantity}kg - ${movement.reason}`);
        });

        if (stockMovements.length >= 2) {
            console.log('  ✅ TEST 4 PASSED: Stock movement history recorded correctly\n');
        } else {
            console.log('  ❌ TEST 4 FAILED: Missing stock movements!\n');
            throw new Error('Test 4 failed');
        }

        // Final Summary
        console.log('='.repeat(60));
        console.log('VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log('✅ All tests passed successfully!');
        console.log('');
        console.log('Key Findings:');
        console.log('  • Wheat purchases work WITHOUT Product Catalog');
        console.log('  • Inventory items created directly by name');
        console.log('  • Stock aggregates correctly across multiple purchases');
        console.log('  • Stock middleware updates inventory automatically');
        console.log('  • Audit trail maintained through Stock movements');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:');
        console.error('Error:', error.message);
        console.error('\nStack trace:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from database');
    }
}

verifyWheatPurchaseFlow();
