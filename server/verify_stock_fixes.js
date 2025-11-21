import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Warehouse from "./model/warehouse.js";
import Product from "./model/Product.js";
import Inventory from "./model/inventory.js";
import Stock from "./model/stock.js";
import Production from "./model/Production.js";
import Sale from "./model/Sale.js";
import { createProduction } from "./controller/productionController.js";
import { createSale } from "./controller/salesController.js";

dotenv.config();

// Mock Request and Response
const mockReq = (body, user) => ({
    body,
    user: user || { _id: "507f1f77bcf86cd799439011", firstName: "Test", lastName: "User", role: "Admin" },
    params: {}
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function runVerification() {
    try {
        console.log("🚀 Starting Stock Fixes Verification...");

        // Connect directly to LOCAL MongoDB to avoid DNS/Network issues
        const MONGO_URL = 'mongodb://localhost:27017/flourmill_test';
        console.log(`🔗 Connecting to: ${MONGO_URL}`);

        await mongoose.connect(MONGO_URL, {
            serverSelectionTimeoutMS: 5000, // Fast fail
            socketTimeoutMS: 45000,
        });
        console.log("✅ Connected to MongoDB");

        // DROP DATABASE to ensure clean slate (removes all data and indexes)
        console.log("🗑️ Dropping test database to ensure clean state...");
        await mongoose.connection.db.dropDatabase();
        console.log("✅ Database dropped.");

        // 1. Setup Test Data
        console.log("\n📝 Setting up test data...");

        const warehouse = new Warehouse({
            name: "Test Warehouse",
            location: "Test Location",
            capacity: { totalCapacity: 10000, currentUsage: 0 },
            status: "Active"
        });
        await warehouse.save();
        console.log(`✅ Created Warehouse: ${warehouse._id}`);

        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 100);
        const wheatCode1 = `W1-${timestamp}-${random}`;
        const wheatCode2 = `W2-${timestamp}-${random}`;
        const flourCode = `F-${timestamp}-${random}`;

        const wheatProduct1 = new Product({
            name: "Test Wheat Batch A",
            code: wheatCode1,
            category: "Raw Materials",
            subcategory: "Wheat Grain",
            unit: "kg",
            weight: 1,
            minimumStock: 10
        });
        await wheatProduct1.save();
        console.log(`✅ Created Wheat Product 1: ${wheatProduct1._id} (Code: ${wheatCode1})`);

        const wheatProduct2 = new Product({
            name: "Test Wheat Batch B",
            code: wheatCode2,
            category: "Raw Materials",
            subcategory: "Wheat Grain",
            unit: "kg",
            weight: 1,
            minimumStock: 10
        });
        await wheatProduct2.save();
        console.log(`✅ Created Wheat Product 2: ${wheatProduct2._id} (Code: ${wheatCode2})`);

        const flourProduct = new Product({
            name: "Test Flour",
            code: flourCode, // Random code
            category: "Finished Goods",
            subcategory: "Flour",
            unit: "bags",
            weight: 20,
            minimumStock: 10
        });
        await flourProduct.save();
        console.log(`✅ Created Flour Product: ${flourProduct._id} (Code: ${flourCode})`);

        // 2. Test Stock Model Middleware (Large Addition)
        console.log("\n🧪 Test 1: Stock Model Middleware (Large Addition)");

        // Create Inventory for Wheat 1
        const wheatInventory1 = new Inventory({
            product: wheatProduct1._id,
            warehouse: warehouse._id,
            currentStock: 0,
            status: "Active"
        });
        await wheatInventory1.save();

        // Add 5000kg of wheat to Inv 1
        const stockIn = new Stock({
            inventoryItem: wheatInventory1._id,
            movementType: 'in',
            quantity: 5000,
            reason: "Test Purchase",
            warehouse: warehouse._id,
            createdBy: "507f1f77bcf86cd799439011"
        });
        await stockIn.save();

        // Verify Inventory Update
        const updatedInventory1 = await Inventory.findById(wheatInventory1._id);
        if (updatedInventory1.currentStock === 5000) {
            console.log("✅ Stock Model: Large addition successful. Inventory updated to 5000.");
        } else {
            console.error(`❌ Stock Model: Inventory update failed. Expected 5000, got ${updatedInventory1.currentStock}`);
        }

        // 3. Test Production Controller (Split Deduction)
        console.log("\n🧪 Test 2: Production Controller (Split Deduction)");

        // Create Inventory for Wheat 2 (Second pile)
        const wheatInventory2 = new Inventory({
            product: wheatProduct2._id,
            warehouse: warehouse._id,
            currentStock: 1000, // 1000kg in second pile
            status: "Active"
        });
        await wheatInventory2.save();

        // Total Wheat: 5000 (Inv1) + 1000 (Inv2) = 6000kg

        // Request Production: Consume 5500kg Wheat
        // Should take 5000 from Inv1 and 500 from Inv2 (or vice versa depending on sort)

        const req = mockReq({
            sourceWarehouse: warehouse._id,
            destinationWarehouse: warehouse._id,
            wheatQuantity: 5500,
            outputProducts: [{
                productId: flourProduct._id,
                quantity: 200, // 200 bags * 20kg = 4000kg output
                weight: 20,
                unit: "bags"
            }],
            wastage: { quantity: 100, reason: "Processing Loss" }
        });
        const res = mockRes();

        await createProduction(req, res);

        if (res.statusCode === 201) {
            console.log("✅ Production created successfully.");

            // Verify Deductions
            const checkInv1 = await Inventory.findById(wheatInventory1._id);
            const checkInv2 = await Inventory.findById(wheatInventory2._id);

            console.log(`   Inv1 Stock (was 5000): ${checkInv1.currentStock}`);
            console.log(`   Inv2 Stock (was 1000): ${checkInv2.currentStock}`);

            const totalRemaining = checkInv1.currentStock + checkInv2.currentStock;
            if (totalRemaining === 500) { // 6000 - 5500 = 500
                console.log("✅ Production: Total wheat deduction correct.");
            } else {
                console.error(`❌ Production: Total wheat deduction incorrect. Expected 500, got ${totalRemaining}`);
            }

            // Check if split happened (both should be affected or one empty)
            if (checkInv1.currentStock < 5000 && checkInv2.currentStock < 1000) {
                console.log("✅ Production: Split deduction verified (both piles reduced).");
            } else if ((checkInv1.currentStock === 0 || checkInv2.currentStock === 0) && totalRemaining === 500) {
                console.log("✅ Production: Split deduction verified (one pile exhausted).");
            } else {
                console.warn("⚠️ Production: Split deduction logic might not have triggered as expected.");
            }

        } else {
            console.error("❌ Production creation failed:", res.data);
        }

        // 4. Test Sales Controller
        console.log("\n🧪 Test 3: Sales Controller");

        // We produced 200 bags of flour. Let's sell 50.
        const reqSale = mockReq({
            customer: { name: "Test Customer" },
            warehouse: warehouse._id,
            items: [{
                product: flourProduct._id,
                quantity: 50,
                unitPrice: 100,
                unit: "bags"
            }],
            paymentMethod: "Cash",
            paidAmount: 5000
        });
        const resSale = mockRes();

        await createSale(reqSale, resSale);

        if (resSale.statusCode === 201) {
            console.log("✅ Sale created successfully.");

            // Verify Stock Deduction
            // Find flour inventory
            const flourInventory = await Inventory.findOne({ product: flourProduct._id, warehouse: warehouse._id });
            // Initial was 0, Production added 200, Sale removed 50 -> Expect 150
            if (flourInventory.currentStock === 150) {
                console.log("✅ Sale: Stock deduction correct. 200 - 50 = 150.");
            } else {
                console.error(`❌ Sale: Stock deduction incorrect. Expected 150, got ${flourInventory.currentStock}`);
            }
        } else {
            console.error("❌ Sale creation failed:", resSale.data);
        }

        console.log("\n🎉 Verification Complete!");
        process.exit(0);

    } catch (error) {
        const errorLog = `Verification Failed: ${error.message}\n` +
            (error.errors ? JSON.stringify(error.errors, null, 2) : '') +
            (error.stack ? `\nStack: ${error.stack}` : '');

        console.error(errorLog);
        fs.writeFileSync('verification_error.log', errorLog);
        process.exit(1);
    }
}

runVerification();
