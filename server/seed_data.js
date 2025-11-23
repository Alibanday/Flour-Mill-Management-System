import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import models
import Warehouse from './model/wareHouse.js';
import Supplier from './model/Supplier.js';
import Product from './model/Product.js';
import User from './model/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function seedDatabase() {
    console.log('🌱 Starting Database Seed...');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

        // 1. Create Admin User (if not exists)
        let admin = await User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            admin = await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'password123', // You should hash this in real app
                role: 'Admin',
                mobile: '1234567890'
            });
            console.log('✅ Created Admin User');
        } else {
            console.log('ℹ️  Admin User already exists');
        }

        // 2. Create Warehouse
        let warehouse = await Warehouse.findOne({ name: 'Main Warehouse' });
        if (!warehouse) {
            warehouse = await Warehouse.create({
                name: 'Main Warehouse',
                warehouseNumber: 'WH-001',
                location: 'Main Street, City',
                status: 'Active',
                capacity: {
                    totalCapacity: 10000,
                    unit: '50kg bags',
                    currentUsage: 0
                },
                manager: admin._id
            });
            console.log('✅ Created Main Warehouse');
        } else {
            console.log('ℹ️  Main Warehouse already exists');
        }

        // 3. Create Supplier
        let supplier = await Supplier.findOne({ name: 'Best Grains Ltd' });
        if (!supplier) {
            supplier = await Supplier.create({
                name: 'Best Grains Ltd',
                supplierCode: 'SUP-001', // Fixed: Required field
                contactPerson: 'John Doe',
                email: 'supplier@example.com',
                phone: '0987654321',
                address: {               // Fixed: Must be an object
                    street: 'Supplier Road',
                    city: 'Supplier City',
                    state: 'Supplier State',
                    postalCode: '12345',
                    country: 'Supplier Country'
                },
                type: 'Grains',
                status: 'Active',
                createdBy: admin._id     // Fixed: Required field
            });
            console.log('✅ Created Supplier');
        } else {
            console.log('ℹ️  Supplier already exists');
        }

        // 4. Create Product
        let product = await Product.findOne({ name: 'Fine' });
        if (!product) {
            product = await Product.create({
                name: 'Fine',
                code: 'PROD-FINE',
                category: 'Finished Goods', // Fixed: Must match enum
                subcategory: 'Flour',       // Fixed: Required field
                unit: 'kg',
                price: 1500,
                weightVariants: [
                    { weight: 10, price: 1500, isActive: true },
                    { weight: 20, price: 3000, isActive: true },
                    { weight: 50, price: 7500, isActive: true }
                ]
            });
            console.log('✅ Created Product: Fine');
        } else {
            console.log('ℹ️  Product "Fine" already exists');
        }

        console.log('\n✨ Database seeded successfully!');
        console.log('👉 You can now restart your server and verify the flow.');

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`   👉 ${key}: ${error.errors[key].message}`);
            });
        }
    } finally {
        await mongoose.disconnect();
    }
}

seedDatabase();
