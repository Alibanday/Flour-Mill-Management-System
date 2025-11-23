import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('🔄 Connecting to MongoDB Atlas...');
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected!\n');

const db = mongoose.connection.db;

// Get the warehouse ID
const warehouse = await db.collection('warehouses').findOne({ name: 'Main Warehouse' });
if (!warehouse) {
    console.log('❌ Main Warehouse not found! Did you run seed_data.js?');
    process.exit(1);
}
const warehouseId = warehouse._id;

console.log(`📍 Monitoring Warehouse: ${warehouse.name} (${warehouseId})\n`);

// Check current state BEFORE
console.log('📊 BEFORE - Current State:');
const bagPurchasesBefore = await db.collection('bagpurchases').countDocuments();
const stocksBefore = await db.collection('stocks').countDocuments();
const inventoriesBefore = await db.collection('inventories').countDocuments();

console.log(`  Bag Purchases: ${bagPurchasesBefore}`);
console.log(`  Stock Movements: ${stocksBefore}`);
console.log(`  Inventory Items: ${inventoriesBefore}\n`);

console.log('⏳ Please create a bag purchase through the UI now...');
console.log('   (I\'ll wait 60 seconds for you to complete the purchase)\n');

// Wait 60 seconds
await new Promise(resolve => setTimeout(resolve, 60000));

// Check state AFTER
console.log('\n📊 AFTER - Checking for changes...\n');

const bagPurchasesAfter = await db.collection('bagpurchases').find().sort({ createdAt: -1 }).limit(1).toArray();
const stocksAfter = await db.collection('stocks').find().sort({ createdAt: -1 }).limit(3).toArray();
const inventoriesAfter = await db.collection('inventories').find().sort({ updatedAt: -1 }).limit(3).toArray();

console.log('📦 Latest Bag Purchase:');
if (bagPurchasesAfter.length > 0) {
    const latest = bagPurchasesAfter[0];
    console.log(`  ✅ ${latest.purchaseNumber}`);
    console.log(`     Warehouse: ${latest.warehouse}`);
    console.log(`     Status: ${latest.status}`);
    console.log(`     Bags:`, JSON.stringify(latest.bags, null, 2));
} else {
    console.log('  ❌ No bag purchases found');
}

console.log('\n📊 Latest Stock Movements:');
stocksAfter.forEach((stock, i) => {
    console.log(`  ${i + 1}. ${stock.referenceNumber} - ${stock.movementType} - ${stock.quantity}kg`);
    console.log(`     Warehouse: ${stock.warehouse}`);
    console.log(`     Created: ${stock.createdAt}`);
});

console.log('\n📋 Latest Inventory Items:');
inventoriesAfter.forEach((inv, i) => {
    console.log(`  ${i + 1}. ${inv.name} - Stock: ${inv.currentStock}`);
    console.log(`     Warehouse: ${inv.warehouse}`);
    console.log(`     Updated: ${inv.updatedAt}`);
});

// Summary
console.log('\n📈 Summary:');
const newBagPurchases = await db.collection('bagpurchases').countDocuments() - bagPurchasesBefore;
const newStocks = await db.collection('stocks').countDocuments() - stocksBefore;
const newInventories = await db.collection('inventories').countDocuments() - inventoriesBefore;

console.log(`  New Bag Purchases: ${newBagPurchases}`);
console.log(`  New Stock Movements: ${newStocks}`);
console.log(`  New Inventory Items: ${newInventories}`);

if (newBagPurchases > 0 && newStocks > 0) {
    console.log('\n✅ SUCCESS! Bag purchase created stock movements!');
} else if (newBagPurchases > 0 && newStocks === 0) {
    console.log('\n❌ PROBLEM! Bag purchase created but NO stock movements!');
} else {
    console.log('\n⚠️  No new bag purchase detected. Did you create one?');
}

await mongoose.disconnect();
console.log('\n✅ Disconnected');
