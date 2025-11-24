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

const recalculateStock = async () => {
    await connectDB();

    try {
        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;

        console.log('\n🔧 Starting Stock Recalculation...\n');

        // Step 1: Get all inventory items
        const inventoryItems = await Inventory.find({});
        console.log(`📦 Found ${inventoryItems.length} inventory items`);

        // Step 2: Reset all currentStock to 0
        console.log('\n🔄 Resetting all stock levels to 0...');
        await Inventory.updateMany({}, { currentStock: 0 });
        console.log('✅ Reset complete');

        // Step 3: Get all stock movements sorted by date (oldest first)
        console.log('\n📊 Fetching all stock movements...');
        const stockMovements = await Stock.find({})
            .sort({ createdAt: 1 })
            .populate('inventoryItem', '_id name');

        console.log(`📋 Found ${stockMovements.length} stock movements`);

        // Step 4: Replay all stock movements
        console.log('\n⏯️  Replaying stock movements...\n');

        let processedCount = 0;
        let errorCount = 0;
        const inventoryUpdates = new Map(); // Track updates in memory for efficiency

        for (const movement of stockMovements) {
            try {
                if (!movement.inventoryItem) {
                    console.warn(`⚠️  Movement ${movement._id} has no inventory item, skipping`);
                    errorCount++;
                    continue;
                }

                const inventoryId = movement.inventoryItem._id.toString();

                // Get current calculated stock from our map, or 0 if first time
                const currentStock = inventoryUpdates.get(inventoryId) || 0;

                // Calculate new stock based on movement type
                let newStock = currentStock;
                if (movement.movementType === 'in') {
                    newStock = currentStock + movement.quantity;
                } else if (movement.movementType === 'out') {
                    newStock = currentStock - movement.quantity;
                }

                // Update our tracking map
                inventoryUpdates.set(inventoryId, newStock);

                processedCount++;

                // Log progress every 100 movements
                if (processedCount % 100 === 0) {
                    console.log(`   Processed ${processedCount}/${stockMovements.length} movements...`);
                }
            } catch (err) {
                console.error(`❌ Error processing movement ${movement._id}:`, err.message);
                errorCount++;
            }
        }

        console.log(`\n✅ Processed ${processedCount} movements (${errorCount} errors)`);

        // Step 5: Update all inventory items with calculated stock
        console.log('\n💾 Updating inventory records...\n');

        let updatedCount = 0;
        for (const [inventoryId, calculatedStock] of inventoryUpdates.entries()) {
            try {
                await Inventory.findByIdAndUpdate(inventoryId, {
                    currentStock: calculatedStock
                });
                updatedCount++;

                const item = await Inventory.findById(inventoryId);
                console.log(`   ✓ ${item.name}: ${calculatedStock} ${item.unit || 'units'}`);
            } catch (err) {
                console.error(`❌ Error updating inventory ${inventoryId}:`, err.message);
            }
        }

        console.log(`\n✅ Updated ${updatedCount} inventory items`);

        // Step 6: Summary
        console.log('\n📈 Recalculation Summary:');
        console.log(`   Total Inventory Items: ${inventoryItems.length}`);
        console.log(`   Total Stock Movements: ${stockMovements.length}`);
        console.log(`   Movements Processed: ${processedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Inventory Updated: ${updatedCount}`);

        // Step 7: Show items with stock
        console.log('\n📦 Items with Stock:');
        const itemsWithStock = await Inventory.find({ currentStock: { $gt: 0 } });
        itemsWithStock.forEach(item => {
            console.log(`   • ${item.name}: ${item.currentStock} ${item.unit || 'units'} (Warehouse: ${item.warehouse})`);
        });

        console.log('\n✅ Stock recalculation complete!\n');

    } catch (error) {
        console.error('❌ Recalculation Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from database');
    }
};

// Run the recalculation
recalculateStock();
