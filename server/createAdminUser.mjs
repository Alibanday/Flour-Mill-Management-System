// Script to create an admin user in the database
// Run this with: node createAdminUser.mjs

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Define User schema inline
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['Admin', 'General Manager', 'Sales Manager', 'Production Manager', 'Warehouse Manager', 'Manager', 'Employee', 'Cashier', 'Sales'],
        default: 'Employee'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    assignedWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@flourmill.com' });

        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);

            // Update password if needed
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log('✅ Admin password updated to: admin123');
        } else {
            // Create new admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const adminUser = new User({
                firstName: 'John',
                lastName: 'Doe',
                email: 'admin@flourmill.com',
                password: hashedPassword,
                role: 'Admin',
                status: 'Active'
            });

            await adminUser.save();
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📋 Admin Credentials:');
        console.log('Email: admin@flourmill.com');
        console.log('Password: admin123');
        console.log('Role: Admin');

        // Create other users
        const users = [
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'manager@flourmill.com',
                password: 'manager123',
                role: 'General Manager',
                status: 'Active'
            },
            {
                firstName: 'Mike',
                lastName: 'Johnson',
                email: 'sales@flourmill.com',
                password: 'sales123',
                role: 'Sales Manager',
                status: 'Active'
            },
            {
                firstName: 'Sarah',
                lastName: 'Wilson',
                email: 'production@flourmill.com',
                password: 'production123',
                role: 'Production Manager',
                status: 'Active'
            }
        ];

        for (const userData of users) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);

                const user = new User({
                    ...userData,
                    password: hashedPassword
                });

                await user.save();
                console.log(`✅ Created ${userData.role}: ${userData.email}`);
            } else {
                console.log(`ℹ️  ${userData.role} already exists: ${userData.email}`);
            }
        }

        console.log('\n✅ All users ready!');
        console.log('\n📋 Login Credentials:');
        console.log('Admin: admin@flourmill.com / admin123');
        console.log('General Manager: manager@flourmill.com / manager123');
        console.log('Sales Manager: sales@flourmill.com / sales123');
        console.log('Production Manager: production@flourmill.com / production123');

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

createAdminUser();
