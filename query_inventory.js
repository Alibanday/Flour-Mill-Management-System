import mongoose from 'mongoose';
import Product from './model/Product.js';
import Inventory from './model/inventory.js';

(async () => {
    const MONGO_URL = 'mongodb://localhost:27017/flourmill_test_flow';
    await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
    const flour = await Product.findOne({ name: 'Test Flour' });
    const wheat = await Product.findOne({ name: 'Test Wheat' });
    if (flour) {
        const invFlour = await Inventory.findOne({ product: flour._id });
        console.log('Flour inventory:', invFlour ? invFlour.currentStock : 'none');
    }
    if (wheat) {
        const invWheat = await Inventory.findOne({ product: wheat._id });
        console.log('Wheat inventory:', invWheat ? invWheat.currentStock : 'none');
    }
    process.exit(0);
})();
