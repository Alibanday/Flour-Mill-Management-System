import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const verifyFlows = async () => {
    await connectDB();

    try {
        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;
        const Warehouse = (await import('./model/warehouse.js')).default;

        console.log('\n🔍 Verifying Inventory Flows...\n');

        // Get all warehouses
        const warehouses = await Warehouse.find({ status: 'Active' }).limit(2);
        if (warehouses.length < 2) {
            console.log('⚠️  Need at least 2 active warehouses for full testing');
            return;
        }

        const warehouse1 = warehouses[0];
        const warehouse2 = warehouses[1];

        console.log(`📦 Using Warehouses:`);
        console.log(`   Warehouse 1: ${warehouse1.name} (${warehouse1._id})`);
        console.log(`   Warehouse 2: ${warehouse2.name} (${warehouse2._id})`);

        // Test 1: Check Wheat Inventory in Warehouse 1
        console.log('\n\n📋 Test 1: Wheat Inventory Check');
        console.log('─'.repeat(50));

        const wheatItems = await Inventory.find({
            warehouse: warehouse1._id,
            $or: [
                { category: { $regex: 'wheat', $options: 'i' } },
                { name: { $regex: 'wheat', $options: 'i' } },
                { subcategory: { $regex: 'wheat', $options: 'i' } }
            ]
        });

        if (wheatItems.length === 0) {
            console.log('❌ No wheat inventory found in Warehouse 1');
        } else {
            console.log(`✅ Found ${wheatItems.length} wheat inventory item(s):`);
            wheatItems.forEach(item => {
                console.log(`   • ${item.name}: ${item.currentStock} ${item.unit || 'kg'}`);
            });
        }

        // Test 2: Check Bag Inventory
        console.log('\n\n📋 Test 2: Bag Inventory Check');
        console.log('─'.repeat(50));

        const bagItems = await Inventory.find({
            warehouse: warehouse1._id,
            $or: [
                { category: 'Packaging Materials' },
                { name: { $regex: 'bag', $options: 'i' } }
            ]
        });

        if (bagItems.length === 0) {
            console.log('❌ No bag inventory found');
        } else {
            console.log(`✅ Found ${bagItems.length} bag inventory item(s):`);
            bagItems.forEach(item => {
                console.log(`   • ${item.name}: ${item.currentStock} ${item.unit || 'bags'}`);
            });
        }

        // Test 3: Check Stock Movements
        console.log('\n\n📋 Test 3: Recent Stock Movements');
        console.log('─'.repeat(50));

        const recentMovements = await Stock.find({
            warehouse: warehouse1._id
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('inventoryItem', 'name');

        if (recentMovements.length === 0) {
            console.log('❌ No stock movements found');
        } else {
            console.log(`✅ Found ${recentMovements.length} recent movements:`);
            recentMovements.forEach(movement => {
                const itemName = movement.inventoryItem?.name || 'Unknown';
                const sign = movement.movementType === 'in' ? '+' : '-';
                console.log(`   ${sign} ${movement.quantity} ${itemName} (${movement.reason})`);
            });
        }

        // Test 4: Verify Stock Consistency
        console.log('\n\n📋 Test 4: Stock Consistency Check');
        console.log('─'.repeat(50));

        const allInventory = await Inventory.find({ warehouse: warehouse1._id });
        let consistencyIssues = 0;

        for (const item of allInventory) {
            // Calculate expected stock from movements
            const movements = await Stock.find({ inventoryItem: item._id }).sort({ createdAt: 1 });

            let calculatedStock = 0;
            for (const movement of movements) {
                if (movement.movementType === 'in') {
                    calculatedStock += movement.quantity;
                } else if (movement.movementType === 'out') {
                    calculatedStock -= movement.quantity;
                }
            }

            // Compare with current stock
            if (Math.abs(calculatedStock - item.currentStock) > 0.01) {
                console.log(`❌ Inconsistency: ${item.name}`);
                console.log(`   Expected: ${calculatedStock}, Actual: ${item.currentStock}`);
                consistencyIssues++;
            }
        }

        if (consistencyIssues === 0) {
            console.log(`✅ All ${allInventory.length} inventory items are consistent!`);
        } else {
            console.log(`⚠️  Found ${consistencyIssues} inconsistencies`);
        }

        // Test 5: Check Production Outputs
        console.log('\n\n📋 Test 5: Production Output Check');
        console.log('─'.repeat(50));

        const finishedGoods = await Inventory.find({
            warehouse: warehouse2._id,
            category: 'Finished Goods'
        });

        if (finishedGoods.length === 0) {
            console.log('ℹ️  No finished goods found in Warehouse 2');
        } else {
            console.log(`✅ Found ${finishedGoods.length} finished goods item(s):`);
            finishedGoods.forEach(item => {
                console.log(`   • ${item.name}: ${item.currentStock} ${item.unit || 'bags'}`);
            });
        }

        // Summary
        console.log('\n\n📊 Verification Summary');
        console.log('═'.repeat(50));
        console.log(`✓ Wheat Items: ${wheatItems.length}`);
        console.log(`✓ Bag Items: ${bagItems.length}`);
        console.log(`✓ Recent Movements: ${recentMovements.length}`);
        console.log(`✓ Consistency Issues: ${consistencyIssues}`);
        console.log(`✓ Finished Goods: ${finishedGoods.length}`);

        if (consistencyIssues === 0 && wheatItems.length > 0) {
            console.log('\n✅ System is working correctly!');
        } else if (consistencyIssues > 0) {
            console.log('\n⚠️  Run recalculate_stock.js to fix inconsistencies');
        } else {
            console.log('\nℹ️  Add some purchases to test the system');
        }

        console.log('\n');

    } catch (error) {
        console.error('❌ Verification Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from database');
    }
};

// Run verification
verifyFlows();
