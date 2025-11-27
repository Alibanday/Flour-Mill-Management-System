# Food Purchase Stock Tracking Implementation

## Changes Made

### 1. **Server Route Update** (`server/routes/foodPurchases.js`)

Added automatic stock tracking for food purchases:

#### A. Warehouse Validation (Lines 163-179)
```javascript
// Validate warehouse
if (!warehouse || !mongoose.Types.ObjectId.isValid(warehouse)) {
  // Try to get the first available warehouse as fallback
  const Warehouse = (await import("../model/wareHouse.js")).default;
  const firstWarehouse = await Warehouse.findOne({ status: 'Active' });
  if (firstWarehouse) {
    var warehouseId = firstWarehouse._id;
  } else {
    return res.status(400).json({ 
      success: false, 
      message: "Valid warehouse ID is required" 
    });
  }
} else {
  var warehouseId = new mongoose.Types.ObjectId(warehouse);
}
```

#### B. Stock Movement Creation (Lines 235-287)
```javascript
// Process each food item in the purchase
for (const foodItem of foodItems) {
  // Find or create inventory item
  let inventoryItem = await Inventory.findOne({
    name: { $regex: foodItem.name, $options: 'i' },
    warehouse: warehouseId
  });
  
  if (!inventoryItem) {
    // Create new inventory item for this food type
    inventoryItem = new Inventory({
      name: foodItem.name,
      category: foodItem.category || 'Raw Materials',
      subcategory: productType,
      unit: foodItem.unit || 'kg',
      currentStock: 0, // Will be updated by stock movement
      minimumStock: 10,
      warehouse: warehouseId,
      cost: {
        purchasePrice: foodItem.unitPrice || 0,
        currency: 'PKR'
      },
      status: 'Active'
    });
    await inventoryItem.save();
  }
  
  // Create stock in movement
  const stockIn = new Stock({
    inventoryItem: inventoryItem._id,
    movementType: 'in',
    quantity: foodItem.quantity,
    reason: `Food Purchase - ${generatedPurchaseNumber}`,
    referenceNumber: generatedPurchaseNumber,
    warehouse: warehouseId,
    createdBy: req.user._id
  });
  
  await stockIn.save();
}
```

### 2. **FoodPurchase Model Update** (`server/model/FoodPurchase.js`)

Added warehouse field to track which warehouse the food purchase is for:

```javascript
warehouse: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Warehouse",
  required: false,
},
```

### 3. **Warehouse Inventory Details Update** (`server/controller/warehouseController.js`)

#### A. Import FoodPurchase Model (Line 477)
```javascript
const FoodPurchase = (await import("../model/FoodPurchase.js")).default;
```

#### B. Fetch Food Purchases (Lines 501-505)
```javascript
const foodPurchases = await FoodPurchase.find({ 
  warehouse: warehouseId,
  status: { $in: ['Pending', 'Approved', 'Completed'] }
}).sort({ purchaseDate: -1 });
```

#### C. Process Food Purchases for Inventory (Lines 635-650)
```javascript
// Process food purchases
foodPurchases.forEach(purchase => {
  if (purchase.foodItems && purchase.foodItems.length > 0) {
    purchase.foodItems.forEach(foodItem => {
      wheatInventory.totalWheat += foodItem.quantity;
      wheatInventory.wheat.push({
        purchaseNumber: purchase.purchaseNumber,
        quantity: foodItem.quantity,
        unit: foodItem.unit,
        date: purchase.purchaseDate,
        source: 'Private',
        quality: foodItem.quality || 'Standard'
      });
    });
  }
});
```

## How It Works Now

### Food Purchase Flow:
1. **User creates food purchase** with warehouse selection
2. **System validates warehouse** or uses fallback
3. **For each food item:**
   - Find or create Inventory item
   - Create Stock movement (type: 'in')
   - Update inventory stock automatically
   - Update warehouse capacity
4. **Food purchase is saved** with warehouse reference
5. **Stock is now in the warehouse** ✓

### Warehouse Detail View:
- Shows food purchases from `FoodPurchase` model
- Shows actual stock levels from Stock movements
- Displays in "Wheat Inventory" and "Actual Stock" tabs

## Benefits

✅ **Automatic Stock Addition** - Food purchases automatically add to warehouse stock
✅ **Inventory Creation** - New inventory items are created on-the-fly
✅ **Warehouse Tracking** - Each food purchase is linked to a warehouse
✅ **Stock Movements** - Every food purchase creates a Stock record for traceability
✅ **Real-time View** - Warehouse detail shows actual food stock levels

## Usage

1. **Create Food Purchase** → Select warehouse
2. **Submit purchase** → Stock is automatically added
3. **View warehouse detail** → See food stock in "Wheat Inventory" and "Actual Stock" tabs

## Complete Stock Tracking System

Now ALL purchase types have automatic stock tracking:

✅ **Regular Purchases** → Stock added to warehouse  
✅ **Bag Purchases** → Stock added to warehouse  
✅ **Food Purchases** → Stock added to warehouse  
✅ **Sales** → Stock deducted from warehouse  
✅ **Production** → Output added to warehouse

The system is now complete and fully integrated!

