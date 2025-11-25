import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkWheatPurchaseFlow() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
        console.log('✅ Connected.\n');

        // Import models
        const Product = (await import('./model/Product.js')).default;
        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;
        const FoodPurchase = (await import('./model/FoodPurchase.js')).default;

        // 1. Check if "Wheat" product exists in Product catalog
        console.log('📦 Checking Product Catalog for Wheat...');
        const wheatProducts = await Product.find({
            name: { $regex: /wheat/i },
            status: 'Active'
        });

        if (wheatProducts.length === 0) {
            console.log('❌ NO WHEAT PRODUCT FOUND IN CATALOG!');
            console.log('   This is the problem - wheat purchases require a "Wheat" product in the catalog.');
            console.log('   Creating one now...\n');

            const wheatProduct = new Product({
                name: 'Wheat',
                code: 'WHEAT-001',
                category: 'Raw Materials',
                subcategory: 'Grains',
                unit: 'kg',
                purchasePrice: 50,
                price: 60,
                minimumStock: 100,
                status: 'Active'
            });
            await wheatProduct.save();
            console.log('✅ Created Wheat product:', wheatProduct._id);
        } else {
            console.log(`✅ Found ${wheatProducts.length} wheat product(s):`);
            wheatProducts.forEach(p => {
                console.log(`   - ${p.name} (${p._id}) - Category: ${p.category}, Status: ${p.status}`);
            });
        }

        // 2. Check recent Food Purchases
        console.log('\n📋 Checking recent Food Purchases...');
        const recentPurchases = await FoodPurchase.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('warehouse', 'name');

        if (recentPurchases.length === 0) {
            console.log('   No food purchases found.');
        } else {
            console.log(`   Found ${recentPurchases.length} recent purchase(s):`);
            recentPurchases.forEach(p => {
                console.log(`   - ${p.purchaseNumber} - Warehouse: ${p.warehouse?.name || 'N/A'}`);
                console.log(`     Items: ${JSON.stringify(p.foodItems)}`);
            });
        }

        // 3. Check Inventory items for wheat
        console.log('\n📊 Checking Inventory for wheat items...');
        const wheatInventory = await Inventory.find({
            $or: [
                { name: { $regex: /wheat/i } },
                { category: { $regex: /wheat/i } }
            ]
        }).populate('warehouse', 'name').populate('product', 'name category');

        if (wheatInventory.length === 0) {
            console.log('   ❌ NO WHEAT INVENTORY ITEMS FOUND!');
            console.log('   This means wheat purchases are not creating inventory items.');
        } else {
            console.log(`   ✅ Found ${wheatInventory.length} wheat inventory item(s):`);
            wheatInventory.forEach(inv => {
                console.log(`   - ${inv.name || inv.product?.name || 'Unknown'}`);
                console.log(`     Warehouse: ${inv.warehouse?.name || 'N/A'}`);
                console.log(`     Current Stock: ${inv.currentStock || 0}`);
                console.log(`     Category: ${inv.category || inv.product?.category || 'N/A'}`);
                console.log(`     Product ID: ${inv.product || 'N/A'}`);
            });
        }

        // 4. Check Stock movements for wheat
        console.log('\n📈 Checking Stock movements for wheat...');
        const wheatStockMovements = await Stock.find({
            reason: { $regex: /wheat|food purchase/i }
        }).sort({ createdAt: -1 }).limit(10).populate('inventoryItem', 'name category');

        if (wheatStockMovements.length === 0) {
            console.log('   No wheat stock movements found.');
        } else {
            console.log(`   Found ${wheatStockMovements.length} stock movement(s):`);
            wheatStockMovements.forEach(s => {
                console.log(`   - ${s.movementType.toUpperCase()} ${s.quantity} - Reason: ${s.reason}`);
                console.log(`     Inventory Item: ${s.inventoryItem?.name || 'N/A'}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected.');
    }
}

checkWheatPurchaseFlow();
