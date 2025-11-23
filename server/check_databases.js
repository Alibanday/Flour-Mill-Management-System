import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Checking MongoDB connection and databases...\n');
console.log('MongoDB URI from .env:', process.env.MONGODB_URI?.substring(0, 50) + '...\n');

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);

console.log('✅ Connected to MongoDB Atlas\n');

// Get the current database name
const currentDb = mongoose.connection.db.databaseName;
console.log(`📍 Current Database: ${currentDb}\n`);

// List all databases on the server
const admin = mongoose.connection.db.admin();
const { databases } = await admin.listDatabases();

console.log('📚 All Databases on MongoDB Atlas:');
databases.forEach((db, index) => {
    const isCurrent = db.name === currentDb ? '👉 (CURRENT)' : '';
    console.log(`${index + 1}. ${db.name} - ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB ${isCurrent}`);
});

console.log('\n🔍 Checking for similar database names...');
const possibleDuplicates = databases.filter(db =>
    db.name.toLowerCase().includes('flour') ||
    db.name.toLowerCase().includes('mill') ||
    db.name.toLowerCase().includes('test')
);

if (possibleDuplicates.length > 1) {
    console.log('\n⚠️  FOUND POTENTIAL DUPLICATE DATABASES:');
    possibleDuplicates.forEach(db => {
        console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
} else {
    console.log('✅ No duplicate databases found');
}

await mongoose.disconnect();
console.log('\n✅ Disconnected');
