/**
 * WHEAT PURCHASE INVENTORY FIX
 * 
 * Problem: Wheat purchases are not showing in warehouse inventory
 * 
 * Root Cause: The code manually updates inventory stock AND creates a Stock record.
 * The Stock model's pre-save middleware ALSO updates inventory, causing a conflict.
 * Additionally, new inventory items aren't being saved before creating Stock records.
 * 
 * Solution: Remove manual inventory update, add save for new inventory items,
 * let Stock model's pre-save middleware handle the update automatically.
 * 
 * File: server/routes/foodPurchases.js
 * Lines to modify: 348-387
 */

// CURRENT CODE (BROKEN):
/*
let inventoryItem = await Inventory.findOne({
  product: product._id,
  warehouse: warehouseId
});

if (!inventoryItem) {
  inventoryItem = new Inventory({
    product: product._id,
    warehouse: warehouseId,
    currentStock: 0,
    minimumStock: product.minimumStock || 10,
    status: 'Active',
    name: product.name,
    code: product.code,
    category: product.category,
    subcategory: product.subcategory,
    unit: product.unit,
    price: product.purchasePrice
  });
}

inventoryItem.currentStock = (inventoryItem.currentStock ?? 0) + foodItem.quantity;  // ❌ REMOVE THIS
inventoryItem.status = inventoryItem.currentStock === 0                               // ❌ REMOVE THIS
  ? 'Out of Stock'                                                                    // ❌ REMOVE THIS
  : (inventoryItem.minimumStock && inventoryItem.currentStock <= inventoryItem.minimumStock ? 'Low Stock' : 'Active');  // ❌ REMOVE THIS
inventoryItem.lastUpdated = new Date();                                               // ❌ REMOVE THIS
await inventoryItem.save();                                                           // ❌ REMOVE THIS

const stockIn = new Stock({
  inventoryItem: inventoryItem._id,
  movementType: 'in',
  quantity: foodItem.quantity,
  reason: `Food Purchase - ${generatedPurchaseNumber}`,
  referenceNumber: generatedPurchaseNumber,
  warehouse: warehouseId,
  createdBy: req.user._id || req.user.id || new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
});

await stockIn.save();
console.log(`✅ Added ${foodItem.quantity} ${foodItem.unit} of ${foodItem.name} to warehouse`);
*/

// FIXED CODE (REPLACE WITH THIS):
let inventoryItem = await Inventory.findOne({
    product: product._id,
    warehouse: warehouseId
});

if (!inventoryItem) {
    inventoryItem = new Inventory({
        product: product._id,
        warehouse: warehouseId,
        currentStock: 0,
        minimumStock: product.minimumStock || 10,
        status: 'Active',
        name: product.name,
        code: product.code,
        category: product.category,
        subcategory: product.subcategory,
        unit: product.unit,
        price: product.purchasePrice
    });
    await inventoryItem.save();  // ✅ SAVE new inventory items
    console.log(`✅ Created inventory for ${product.name}`);
}

// ✅ REMOVED manual stock update - Stock model's pre-save middleware will handle it

// Create Stock movement - the Stock model's pre-save middleware will update inventory automatically
const stockIn = new Stock({
    inventoryItem: inventoryItem._id,
    movementType: 'in',
    quantity: foodItem.quantity,
    reason: `Food Purchase - ${generatedPurchaseNumber}`,
    referenceNumber: generatedPurchaseNumber,
    warehouse: warehouseId,
    createdBy: req.user._id || req.user.id || new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
});

await stockIn.save();
console.log(`✅ Added ${foodItem.quantity} ${foodItem.unit} of ${foodItem.name} to warehouse`);

/**
 * INSTRUCTIONS:
 * 1. Open server/routes/foodPurchases.js
 * 2. Find lines 348-387 (the inventory and stock creation code)
 * 3. Delete lines 369-374 (the manual inventory update)
 * 4. Add after line 367 (after the closing brace of the if block):
 *    await inventoryItem.save();
 *    console.log(`✅ Created inventory for ${product.name}`);
 * 5. Add a comment before the Stock creation:
 *    // Create Stock movement - the Stock model's pre-save middleware will update inventory automatically
 * 6. Save the file
 * 7. Restart your server
 * 8. Try creating a new wheat purchase
 */
