import mongoose from 'mongoose';
import { createBagPurchase } from './controller/bagPurchaseController.js';
import Warehouse from './model/wareHouse.js';
import Supplier from './model/Supplier.js';
import Product from './model/Product.js';
import User from './model/user.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/floor_mill";

async function debugBagPurchase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Get necessary IDs
        const warehouse = await Warehouse.findOne({ status: 'Active' });
        if (!warehouse) throw new Error('No active warehouse found');
        console.log('Using Warehouse:', warehouse.name);

        const supplier = await Supplier.findOne();
        if (!supplier) throw new Error('No supplier found');
        console.log('Using Supplier:', supplier.name);

        const user = await User.findOne();
        if (!user) throw new Error('No user found');
        console.log('Using User:', user.firstName);

        // 2. Find a product to test with (or create a dummy one if needed)
        // Try to find a "Bag" product first
        let product = await Product.findOne({
            $or: [
                { name: { $regex: 'bag', $options: 'i' } },
                { category: 'Packaging Materials' }
            ]
        });

        if (!product) {
            console.log('No existing bag product found, using a generic one or creating one.');
            // Create a dummy product for testing if none exists
            product = await Product.create({
                name: "Debug Test Bag 50kg",
                code: "DBG-BAG-001",
                category: "Packaging Materials",
                subcategory: "Bags",
                weight: 50,
                weightVariants: [{ weight: 50, price: 50, isActive: true }],
                status: "Active",
                minimumStock: 10
            });
        }
        console.log('Using Product:', product.name);

        // 3. Construct Payload (mimicking frontend)
        const bags = {
            [product.name]: {
                quantity: 10,
                unit: "50kg bags", // Matches frontend format: `${weightCategory}kg bags`
                unitPrice: 50,
                totalPrice: 500
            }
        };

        const req = {
            body: {
                warehouse: warehouse._id.toString(),
                supplier: supplier._id.toString(),
                purchaseDate: new Date(),
                status: 'Completed',
                paymentStatus: 'Paid',
                paidAmount: 500,
                bags: bags
            },
            user: { _id: user._id }
        };

        // Mock Response
        const res = {
            status: (code) => {
                console.log(`Response Status Code: ${code}`);
                return {
                    json: (data) => {
                        console.log('Response Data:', JSON.stringify(data, null, 2));
                        return data;
                    }
                };
            }
        };

        console.log('🚀 Invoking createBagPurchase controller...');
        await createBagPurchase(req, res);

    } catch (error) {
        console.error('❌ Debugging failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

debugBagPurchase();
