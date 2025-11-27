# Product Catalog Separation Plan

## Current Problem
- **Inventory** model is being used for BOTH:
  1. Product Catalog (master list of products)
  2. Stock Levels (current quantity per warehouse)
- Forms show catalog items mixed with stock levels
- No clear separation between "what products exist" vs "how much stock we have"

## New Architecture

### Three Separate Models:

1. **Product** (Catalog)
   - Master list of all products
   - One record per product type
   - Stores: name, code, category, price, unit, etc.
   - Example: "50kg ATA Bag", "Wheat Grain"

2. **Inventory** (Stock Levels)
   - Current stock quantity per warehouse
   - One record per product per warehouse
   - Stores: product reference, warehouse, currentStock, minimumStock
   - Example: "50kg ATA Bag in Warehouse A: 100 bags"

3. **Stock** (Movement History)
   - Audit trail of all stock movements
   - Records: when, why, how much, from/to where
   - Updates Inventory.currentStock automatically

## Implementation Steps

### Phase 1: Models ✅
- [x] Create Product model
- [x] Update Inventory model (add product & warehouse references)
- [ ] Update Stock model to ensure warehouse is set

### Phase 2: Purchase Flows
- [ ] Update BagPurchase: Find/Create Product → Find/Create Inventory → Create Stock movement
- [ ] Update FoodPurchase: Find/Create Product → Find/Create Inventory → Create Stock movement
- [ ] Update Regular Purchase: Find/Create Product → Find/Create Inventory → Create Stock movement

### Phase 3: Forms & UI
- [ ] Update Sales forms to use Product catalog for dropdowns
- [ ] Update Purchase forms to use Product catalog
- [ ] Create separate Product Catalog management page
- [ ] Update Inventory page to show only stock levels (filter by warehouse)

### Phase 4: Migration
- [ ] Create migration script to convert existing Inventory items to Products
- [ ] Create Inventory records from existing data (one per warehouse)
- [ ] Test backward compatibility

## Key Changes Needed

### BagPurchase Flow:
```
1. User creates bag purchase → Selects warehouse
2. For each bag type (ATA, Maida, etc.):
   a. Find or create Product in catalog
   b. Find or create Inventory (Product + Warehouse)
   c. Create Stock movement (in)
   d. Stock middleware updates Inventory.currentStock
```

### FoodPurchase Flow:
```
1. User creates food purchase → Selects warehouse
2. For each food item:
   a. Find or create Product in catalog
   b. Find or create Inventory (Product + Warehouse)
   c. Create Stock movement (in)
   d. Stock middleware updates Inventory.currentStock
```

### Sales Form:
```
- Dropdown shows Products (catalog)
- When product selected, check Inventory for that warehouse
- Show available stock from Inventory.currentStock
```

## Benefits
1. Clear separation: Catalog vs Stock
2. Warehouse-specific stock tracking
3. Forms use catalog (cleaner dropdowns)
4. Inventory shows actual stock levels per warehouse
5. No data duplication

