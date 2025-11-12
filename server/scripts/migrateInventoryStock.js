/**
 * Migration script to calculate and populate currentStock for existing inventory items
 * 
 * Run this script once to migrate existing inventory data:
 * node -r esm server/scripts/migrateInventoryStock.js
 * 
 * Or import and use in your application:
 * import { recalculateAllInventoryStock } from '../services/stockCalculationService.js';
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { recalculateAllInventoryStock } from '../services/stockCalculationService.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flourmill';

async function migrate() {
  try {
    console.log('🔄 Starting inventory stock migration...');
    console.log('Connecting to MongoDB:', MONGODB_URI.replace(/\/\/.*@/, '//***@'));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('📊 Recalculating currentStock for all inventory items...');
    const result = await recalculateAllInventoryStock();
    
    console.log('\n📈 Migration Summary:');
    console.log(`   Total items: ${result.total}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Errors: ${result.errors}`);
    
    if (result.errors > 0) {
      console.log('\n❌ Errors encountered:');
      result.errorsList.forEach(err => {
        console.log(`   - ${err.itemName} (${err.itemId}): ${err.error}`);
      });
    }
    
    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export default migrate;

