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

const debugWheatPurchase = async () => {
    await connectDB();

    try {
        const FoodPurchase = (await import('./model/FoodPurchase.js')).default;
        const Inventory = (await import('./model/inventory.js')).default;
        const Stock = (await import('./model/stock.js')).default;
        const Product = (await import('./model/Product.js')).default;

        console.log('\n🔍 Debugging Wheat Purchase Flow...\n');

        // Get the latest food purchase
        const latestPurchase = await FoodPurchase.findOne().sort({ createdAt: -1 });

        if (!latestPurchase) {
            console.log('❌ No food purchases found');
            return;
        }

        console.log('📋 Latest Food Purchase:');
        console.log(`   Purchase Number: ${latestPurchase.purchaseNumber}`);
        console.log(`   Date: ${latestPurchase.purchaseDate}`);
        console.log(`   Warehouse: ${latestPurchase.warehouse}`);
        console.log(`   Items: ${latestPurchase.foodItems.length}`);

        latestPurchase.foodItems.forEach((item, index) => {
            console.log(`\n   Item ${index + 1}:`);
            console.log(`      Name: ${item.name}`);
            console.log(`      Category: ${item.category}`);
            console.log(`      Quantity: ${item.quantity} ${item.unit}`);
        });

        // Check if Product was created
        console.log('\n\n🔍 Checking Product Records...');
        const wheatProducts = await Product.find({
            $or: [
                { name: { $regex: 'wheat', $options: 'i' } },
                { category: 'Raw Materials', subcategory: { $regex: 'wheat', $options: 'i' } }
            ]
        });

        if (wheatProducts.length === 0) {
            console.log('❌ No wheat products found in Product catalog');
        } else {
            console.log(`✅ Found ${wheatProducts.length} wheat product(s):`);
            wheatProducts.forEach(p => {
                console.log(`   • ${p.name} (${p.code})`);
                console.log(`     Category: ${p.category}, Subcategory: ${p.subcategory}`);
            });
        }

        // Check if Inventory was created
        console.log('\n\n🔍 Checking Inventory Records...');
        const wheatInventory = await Inventory.find({
            warehouse: latestPurchase.warehouse,
            $or: [
                { name: { $regex: 'wheat', $options: 'i' } },
                { category: { $regex: 'wheat', $options: 'i' } },
                { subcategory: { $regex: 'wheat', $options: 'i' } }
            ]
        });

        if (wheatInventory.length === 0) {
            console.log('❌ No wheat inventory found in warehouse');

            // Check ALL inventory in this warehouse
            console.log('\n   Checking ALL inventory in this warehouse:');
            const allInventory = await Inventory.find({ warehouse: latestPurchase.warehouse });
            console.log(`   Total items: ${allInventory.length}`);
            allInventory.forEach(item => {
                console.log(`      • ${item.name} (Category: ${item.category}, Stock: ${item.currentStock})`);
            });
        } else {
            console.log(`✅ Found ${wheatInventory.length} wheat inventory item(s):`);
            wheatInventory.forEach(inv => {
                console.log(`   • ${inv.name}`);
                console.log(`     Category: ${inv.category}`);
                console.log(`     Current Stock: ${inv.currentStock} ${inv.unit || 'kg'}`);
                console.log(`     Product ID: ${inv.product}`);
            });
        }

        // Check Stock movements
        console.log('\n\n🔍 Checking Stock Movements...');
        const stockMovements = await Stock.find({
            warehouse: latestPurchase.warehouse,
            referenceNumber: latestPurchase.purchaseNumber
        }).populate('inventoryItem', 'name category');

        if (stockMovements.length === 0) {
            console.log('❌ No stock movements found for this purchase');
        } else {
            console.log(`✅ Found ${stockMovements.length} stock movement(s):`);
            stockMovements.forEach(stock => {
                console.log(`   • ${stock.movementType.toUpperCase()}: ${stock.quantity} units`);
                console.log(`     Item: ${stock.inventoryItem?.name || 'Unknown'}`);
                console.log(`     Reason: ${stock.reason}`);
            });
        }

        // Summary
        console.log('\n\n📊 Summary:');
        console.log(`   Products Created: ${wheatProducts.length > 0 ? '✅' : '❌'}`);
        console.log(`   Inventory Created: ${wheatInventory.length > 0 ? '✅' : '❌'}`);
        console.log(`   Stock Movements: ${stockMovements.length > 0 ? '✅' : '❌'}`);

        if (wheatInventory.length > 0 && wheatInventory[0].currentStock === 0) {
            console.log('\n⚠️  Inventory exists but stock is 0. This might be because:');
            console.log('   1. Stock movement was not created');
            console.log('   2. Stock middleware did not update inventory');
            console.log('   3. Run: node recalculate_stock.js');
        }

        console.log('\n');

    } catch (error) {
        console.error('❌ Debug Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from database');
    }
};

debugWheatPurchase();
