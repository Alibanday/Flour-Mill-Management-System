import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkWheatInventory() {
    try {
        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);

        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;
        const Product = (await import('./model/Product.js')).default;

        console.log('WHEAT INVENTORY CHECK');
        console.log('=====================\n');

        // Check for wheat product in catalog
        const wheatProduct = await Product.findOne({ name: { $regex: /^wheat$/i } });
        console.log('1. Product Catalog:');
        if (wheatProduct) {
            console.log('   Wheat product EXISTS:', wheatProduct._id);
        } else {
            console.log('   Wheat product DOES NOT EXIST');
        }

        // Check for wheat inventory
        const wheatInventory = await Inventory.find({ name: { $regex: /wheat/i } })
            .populate('warehouse', 'name')
            .lean();

        console.log('\n2. Wheat Inventory Items:', wheatInventory.length);
        wheatInventory.forEach((inv, idx) => {
            console.log(`   [${idx + 1}]`, inv.name);
            console.log('       Warehouse:', inv.warehouse?.name || inv.warehouse);
            console.log('       Stock:', inv.currentStock, inv.unit || 'kg');
            console.log('       Product Ref:', inv.product || 'NONE (Direct inventory)');
            console.log('       Category:', inv.category);
        });

        // Check stock movements
        if (wheatInventory.length > 0) {
            const movements = await Stock.find({
                inventoryItem: { $in: wheatInventory.map(i => i._id) }
            }).sort({ createdAt: -1 }).limit(5);

            console.log('\n3. Recent Stock Movements:', movements.length);
            movements.forEach((mov, idx) => {
                console.log(`   [${idx + 1}] ${mov.movementType} ${mov.quantity} - ${mov.reason}`);
            });
        }

        console.log('\n=====================');
        console.log('RESULT: Wheat inventory', wheatInventory.length > 0 ? 'EXISTS' : 'DOES NOT EXIST');
        console.log('Product Catalog Required:', wheatProduct ? 'NO (but exists)' : 'NO');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkWheatInventory();
