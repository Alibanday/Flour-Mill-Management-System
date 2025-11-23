import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('MongoDB URI:', process.env.MONGODB_URI);

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flour-mill');

console.log('✅ Connected to MongoDB');
console.log('Database name:', mongoose.connection.db.databaseName);

// List all collections
const collections = await mongoose.connection.db.listCollections().toArray();
console.log('\n📚 Collections in database:');
collections.forEach(col => {
    console.log(`  - ${col.name}`);
});

// Count documents in each collection
console.log('\n📊 Document counts:');
for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} documents`);
}

// Check specific collections
const bagPurchaseCount = await mongoose.connection.db.collection('bagpurchases').countDocuments();
const stockCount = await mongoose.connection.db.collection('stocks').countDocuments();
const inventoryCount = await mongoose.connection.db.collection('inventories').countDocuments();

console.log('\n🔍 Key Collections:');
console.log(`  Bag Purchases: ${bagPurchaseCount}`);
console.log(`  Stock Movements: ${stockCount}`);
console.log(`  Inventory Items: ${inventoryCount}`);

await mongoose.disconnect();
console.log('\n✅ Disconnected');
