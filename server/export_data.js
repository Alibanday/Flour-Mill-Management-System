import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection.db;

const result = {
    bagPurchases: await db.collection('bagpurchases').find().sort({ createdAt: -1 }).limit(5).toArray(),
    stockMovements: await db.collection('stocks').find().sort({ createdAt: -1 }).limit(10).toArray(),
    inventoryItems: await db.collection('inventories').find().sort({ updatedAt: -1 }).limit(10).toArray(),
    warehouses: await db.collection('warehouses').find().toArray()
};

fs.writeFileSync('database_snapshot.json', JSON.stringify(result, null, 2));

console.log('✅ Data saved to database_snapshot.json');
console.log(`\nSummary:`);
console.log(`  Bag Purchases: ${result.bagPurchases.length}`);
console.log(`  Stock Movements: ${result.stockMovements.length}`);
console.log(`  Inventory Items: ${result.inventoryItems.length}`);
console.log(`  Warehouses: ${result.warehouses.length}`);

await mongoose.disconnect();
