import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flour-mill');

console.log('✅ Connected to MongoDB\n');

// Import models
import BagPurchase from './model/BagPurchase.js';
import Stock from './model/stock.js';
import Inventory from './model/inventory.js';
import Warehouse from './model/wareHouse.js';

// Get the latest bag purchase
console.log('📦 Latest Bag Purchases:');
const latestPurchases = await BagPurchase.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('warehouse', 'name')
    .populate('supplier', 'name');

latestPurchases.forEach((purchase, index) => {
    console.log(`\n${index + 1}. Purchase Number: ${purchase.purchaseNumber}`);
    console.log(`   Warehouse: ${purchase.warehouse?.name || 'N/A'}`);
    console.log(`   Supplier: ${purchase.supplier?.name || 'N/A'}`);
    console.log(`   Date: ${purchase.purchaseDate}`);
    console.log(`   Status: ${purchase.status}`);
    console.log(`   Bags:`, JSON.stringify(purchase.bags, null, 2));
});

// Get latest stock movements
console.log('\n\n📊 Latest Stock Movements:');
const latestStockMovements = await Stock.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('inventoryItem', 'name code')
    .populate('warehouse', 'name');

latestStockMovements.forEach((stock, index) => {
    console.log(`\n${index + 1}. Reference: ${stock.referenceNumber}`);
    console.log(`   Warehouse: ${stock.warehouse?.name || 'N/A'}`);
    console.log(`   Type: ${stock.movementType}`);
    console.log(`   Quantity: ${stock.quantity}`);
    console.log(`   Reason: ${stock.reason}`);
    console.log(`   Inventory Item: ${stock.inventoryItem?.name || 'N/A'}`);
    console.log(`   Created: ${stock.createdAt}`);
});

// Get inventory items
console.log('\n\n📋 Latest Inventory Updates:');
const latestInventory = await Inventory.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('warehouse', 'name')
    .populate('product', 'name');

latestInventory.forEach((inv, index) => {
    console.log(`\n${index + 1}. Product: ${inv.name || inv.product?.name || 'N/A'}`);
    console.log(`   Warehouse: ${inv.warehouse?.name || 'N/A'}`);
    console.log(`   Current Stock: ${inv.currentStock}`);
    console.log(`   Status: ${inv.status}`);
    console.log(`   Last Updated: ${inv.updatedAt}`);
});

await mongoose.disconnect();
console.log('\n\n✅ Disconnected from MongoDB');
