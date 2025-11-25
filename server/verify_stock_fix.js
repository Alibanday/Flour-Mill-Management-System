import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testStockMovement() {
    try {
        console.log('='.repeat(70));
        console.log('TESTING STOCK MOVEMENT RECORDING');
        console.log('='.repeat(70));

        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        const FoodPurchase = (await import('./model/FoodPurchase.js')).default;
        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;
        const Warehouse = (await import('./model/wareHouse.js')).default;

        // Get a warehouse
        const warehouse = await Warehouse.findOne({ status: 'Active' });
        if (!warehouse) {
            console.log('❌ No active warehouse found');
            process.exit(1);
        }
        console.log(`📦 Using warehouse: ${warehouse.name} (${warehouse._id})\n`);

        // Check current state
        console.log('📊 BEFORE PURCHASE:');
        const inventoryBefore = await Inventory.findOne({
            name: /wheat/i,
            warehouse: warehouse._id
        });

        if (inventoryBefore) {
            console.log(`  Inventory ID: ${inventoryBefore._id}`);
            console.log(`  Current Stock: ${inventoryBefore.currentStock || 0}`);
            console.log(`  Status: ${inventoryBefore.status}`);
        } else {
            console.log('  No wheat inventory found (will be created)');
        }

        const stockCountBefore = await Stock.countDocuments({
            warehouse: warehouse._id,
            movementType: 'in'
        });
        console.log(`  Stock movements (in): ${stockCountBefore}\n`);

        // Count purchases before
        const purchaseCountBefore = await FoodPurchase.countDocuments();
        console.log(`📝 Total purchases before: ${purchaseCountBefore}\n`);

        console.log('✅ Verification complete!');
        console.log('\n' + '='.repeat(70));
        console.log('NEXT STEPS:');
        console.log('='.repeat(70));
        console.log('1. Restart your server if it\'s running');
        console.log('2. Create a new wheat purchase through the UI');
        console.log('3. Check the server console for detailed logs:');
        console.log('   - "📦 Processing Wheat: X kg"');
        console.log('   - "📝 Creating Stock movement..."');
        console.log('   - "✅ Stock movement saved successfully"');
        console.log('   - "✅ Inventory currentStock after stock movement: X"');
        console.log('4. Verify in database that:');
        console.log('   - FoodPurchase record is created');
        console.log('   - Inventory currentStock is updated (not 0!)');
        console.log('   - Stock movement record exists');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected');
    }
}

testStockMovement();
