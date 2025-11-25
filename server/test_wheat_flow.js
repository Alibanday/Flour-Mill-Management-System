import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testWheatFlow() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
        console.log('✅ Connected.\n');

        // Import models
        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;
        const Warehouse = (await import('./model/wareHouse.js')).default;
        const User = (await import('./model/user.js')).default;

        // 1. Setup Test Data
        console.log('🛠️ Setting up test data...');

        // Get a warehouse
        let warehouse = await Warehouse.findOne({ name: 'Test Warehouse' });
        if (!warehouse) {
            warehouse = new Warehouse({
                name: 'Test Warehouse',
                location: 'Test Location',
                capacity: {
                    totalCapacity: 10000,
                    unit: '50kg bags',
                    currentUsage: 0
                },
                status: 'Active'
            });
            await warehouse.save();
            console.log('   Created Test Warehouse');
        } else {
            console.log('   Using existing Test Warehouse');
        }

        // Get a user
        const user = await User.findOne({ role: 'Admin' }) || await User.findOne();
        const userId = user ? user._id : new mongoose.Types.ObjectId();

        // 2. Simulate Wheat Purchase Logic (The exact logic we put in the route)
        console.log('\n🧪 Testing Simplified Wheat Purchase Logic...');

        const foodItems = [{
            name: 'Wheat',
            quantity: 50,
            unit: 'kg',
            unitPrice: 60
        }];

        const generatedPurchaseNumber = `TEST-FP-${Date.now()}`;
        const warehouseId = warehouse._id;

        // --- LOGIC START (Copied from route) ---
        for (const foodItem of foodItems) {
            console.log(`📦 Processing ${foodItem.name}: ${foodItem.quantity} ${foodItem.unit}`);

            // For wheat purchases, directly find or create inventory item by name
            let inventoryItem = await Inventory.findOne({
                name: { $regex: new RegExp(`^${foodItem.name}$`, 'i') },
                warehouse: warehouseId
            });

            let initialStock = 0;

            if (!inventoryItem) {
                // Create new inventory item
                inventoryItem = new Inventory({
                    name: foodItem.name,
                    warehouse: warehouseId,
                    currentStock: 0,
                    minimumStock: 100,
                    status: 'Active',
                    category: 'Raw Materials',
                    subcategory: 'Grains',
                    unit: foodItem.unit || 'kg',
                    price: foodItem.unitPrice || 0
                });
                await inventoryItem.save();
                console.log(`   ✅ Created new inventory item for ${foodItem.name}`);
            } else {
                initialStock = inventoryItem.currentStock || 0;
                console.log(`   ✅ Found existing inventory: ${foodItem.name}, Initial Stock = ${initialStock}`);
            }

            // Create Stock movement
            const stockIn = new Stock({
                inventoryItem: inventoryItem._id,
                movementType: 'in',
                quantity: foodItem.quantity,
                reason: `Food Purchase - ${generatedPurchaseNumber}`,
                referenceNumber: generatedPurchaseNumber,
                warehouse: warehouseId,
                createdBy: userId
            });

            await stockIn.save();
            console.log(`   ✅ Stock movement created: +${foodItem.quantity}`);

            // 3. Verify Result
            // We need to wait a bit for the pre-save middleware to run if it's async, 
            // but usually await stockIn.save() waits for pre-save hooks.

            // Reload inventory
            const updatedInventory = await Inventory.findById(inventoryItem._id);
            console.log(`\n📊 Verification Results:`);
            console.log(`   - Previous Stock: ${initialStock}`);
            console.log(`   - Added Quantity: ${foodItem.quantity}`);
            console.log(`   - Expected Stock: ${initialStock + foodItem.quantity}`);
            console.log(`   - Actual Stock:   ${updatedInventory.currentStock}`);

            if (updatedInventory.currentStock === initialStock + foodItem.quantity) {
                console.log('   ✅ SUCCESS: Stock updated correctly!');
            } else {
                console.log('   ❌ FAILURE: Stock mismatch!');
            }
        }
        // --- LOGIC END ---

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected.');
    }
}

testWheatFlow();
