// This is the corrected section for lines 353-387
// Replace lines 353-387 in foodPurchases.js with this:

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
    await inventoryItem.save();
    console.log(`✅ Created inventory for ${product.name}`);
}

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
