import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('✅ Configuration Check\n');
console.log('📍 Server Directory: server/');
console.log('📍 Port:', process.env.PORT);
console.log('📍 MongoDB URI:', process.env.MONGODB_URI?.substring(0, 70) + '...\n');

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);

const dbName = mongoose.connection.db.databaseName;
console.log(`✅ Connected to MongoDB Atlas`);
console.log(`📊 Database Name: ${dbName}\n`);

if (dbName === 'flourmill') {
    console.log('✅ CORRECT! Using the "flourmill" database\n');
} else {
    console.log(`⚠️  WARNING! Connected to "${dbName}" instead of "flourmill"\n`);
}

// Check collections
const collections = await mongoose.connection.db.listCollections().toArray();
console.log(`📚 Collections in "${dbName}" database:`);
if (collections.length === 0) {
    console.log('   (empty - this is a fresh database)\n');
} else {
    collections.forEach(col => {
        console.log(`   - ${col.name}`);
    });
    console.log('');
}

// Count documents
const db = mongoose.connection.db;
const counts = {
    warehouses: await db.collection('warehouses').countDocuments(),
    bagpurchases: await db.collection('bagpurchases').countDocuments(),
    stocks: await db.collection('stocks').countDocuments(),
    inventories: await db.collection('inventories').countDocuments(),
    products: await db.collection('products').countDocuments()
};

console.log('📊 Document Counts:');
Object.entries(counts).forEach(([collection, count]) => {
    console.log(`   ${collection}: ${count}`);
});

console.log('\n✅ Setup Complete!');
console.log('\n📝 Next Steps:');
console.log('   1. Restart your server: npm run dev (in server directory)');
console.log('   2. Create a warehouse through the UI');
console.log('   3. Create a bag purchase');
console.log('   4. Verify it appears in warehouse, stock, and inventory views\n');

await mongoose.disconnect();
