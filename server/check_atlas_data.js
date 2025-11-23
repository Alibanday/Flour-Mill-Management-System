import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('Connecting to:', process.env.MONGODB_URI?.substring(0, 50) + '...');

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);

console.log('✅ Connected to MongoDB Atlas\n');

// Query using native MongoDB driver (no schema needed)
const db = mongoose.connection.db;

// Get latest bag purchases
console.log('📦 Latest Bag Purchases:');
const bagPurchases = await db.collection('bagpurchases')
    .find()
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

console.log(`Found ${bagPurchases.length} bag purchases\n`);
bagPurchases.forEach((purchase, index) => {
    console.log(`${index + 1}. Purchase Number: ${purchase.purchaseNumber}`);
    console.log(`   Warehouse ID: ${purchase.warehouse}`);
    console.log(`   Status: ${purchase.status}`);
    console.log(`   Date: ${purchase.purchaseDate}`);
    console.log(`   Bags:`, purchase.bags);
    console.log('');
});

// Get latest stock movements
console.log('\n📊 Latest Stock Movements:');
const stockMovements = await db.collection('stocks')
    .find()
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

console.log(`Found ${stockMovements.length} stock movements\n`);
stockMovements.forEach((stock, index) => {
    console.log(`${index + 1}. Reference: ${stock.referenceNumber}`);
    console.log(`   Warehouse ID: ${stock.warehouse}`);
    console.log(`   Type: ${stock.movementType}`);
    console.log(`   Quantity: ${stock.quantity}`);
    console.log(`   Reason: ${stock.reason}`);
    console.log(`   Inventory Item ID: ${stock.inventoryItem}`);
    console.log('');
});

// Get inventory items
console.log('\n📋 Latest Inventory Items:');
const inventoryItems = await db.collection('inventories')
    .find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .toArray();

console.log(`Found ${inventoryItems.length} inventory items\n`);
inventoryItems.forEach((inv, index) => {
    console.log(`${index + 1}. Name: ${inv.name}`);
    console.log(`   Warehouse ID: ${inv.warehouse}`);
    console.log(`   Current Stock: ${inv.currentStock}`);
    console.log(`   Status: ${inv.status}`);
    console.log('');
});

// Get warehouses
console.log('\n🏭 Warehouses:');
const warehouses = await db.collection('warehouses')
    .find()
    .toArray();

console.log(`Found ${warehouses.length} warehouses\n`);
warehouses.forEach((wh, index) => {
    console.log(`${index + 1}. ${wh.name} (ID: ${wh._id})`);
    console.log(`   Location: ${wh.location}`);
    console.log('');
});

await mongoose.disconnect();
console.log('✅ Disconnected');
