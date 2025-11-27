# Warehouse Stock Management System

## Overview
This document explains how the comprehensive warehouse stock management system works, tracking all purchases and sales automatically.

## How It Works

### 1. Purchase Flow - Stock Addition

When you make a purchase and select a warehouse:

#### A. Regular Purchases (`/api/purchases`)
- When a purchase is created, the system automatically:
  - Creates Inventory items if they don't exist
  - Creates Stock movements (type: 'in') for each item
  - Updates warehouse capacity usage
  - Updates inventory stock levels

**Location:** `server/controller/purchaseController.js` (lines 91-104)

#### B. Bag Purchases (`/api/bag-purchases`)
- When bags are purchased, the system:
  - Creates Stock movements for each bag type (Ata, Maida, Suji, Fine)
  - Automatically creates Inventory items if they don't exist
  - Links the purchase to the warehouse
  - Updates stock levels automatically

**Location:** `server/routes/bagPurchases.js` (lines 231-280)

#### C. Food Purchases (`/api/food-purchases`)
- When wheat/food is purchased:
  - Creates Stock movements for wheat inventory
  - Updates warehouse stock automatically

**Location:** `server/routes/foodPurchases.js` (lines 217-251)

### 2. Sales Flow - Stock Deduction

When you make a sale and select a warehouse:

#### Sales (`/api/sales`)
- The system automatically:
  - Validates sufficient stock exists
  - Creates Stock movements (type: 'out') for each sold item
  - Deducts from inventory stock levels
  - Updates warehouse capacity usage
  - Checks for low stock alerts

**Location:** `server/controller/salesController.js` (lines 111-127)

### 3. Stock Movement Tracking

The **Stock** model (`server/model/stock.js`) is the heart of the system:

- **Movement Types:**
  - `in`: Stock additions (purchases, production, transfers in)
  - `out`: Stock deductions (sales, transfers out, waste)

- **Automatic Updates:**
  - When stock moves in: `inventory.currentStock += quantity`
  - When stock moves out: `inventory.currentStock -= quantity`
  - Warehouse capacity usage is updated automatically
  - Inventory status (Active, Low Stock, Out of Stock) is updated

- **Pre-save Validation:**
  - Checks sufficient stock exists before 'out' movements
  - Checks warehouse capacity before 'in' movements
  - Updates Inventory.currentStock automatically

### 4. Warehouse Detail View

The warehouse detail screen (`/warehouses/:id`) shows:

#### Tabs:

1. **Bags Inventory** - Shows bag purchases (Ata, Maida, Suji, Fine)
2. **Wheat Inventory** - Shows wheat/food purchases
3. **Production Products** - Shows products from production
4. **Actual Stock** (NEW) - Shows real-time current stock levels
   - Calculates actual stock from Stock movements
   - Shows current quantity for each product
   - Displays total items, total quantity, and total value
   - Only shows products with stock > 0

#### API Endpoint:
`GET /api/warehouses/:id/inventory`

This endpoint:
- Fetches purchases from both `Purchase` and `BagPurchase` models
- Calculates actual stock from `Stock` movements
- Shows inventory as it actually exists in the warehouse
- Accounts for all purchases AND sales

### 5. Key Features

✅ **Automatic Stock Management:**
- Purchases automatically add stock
- Sales automatically deduct stock
- Production adds output products to stock

✅ **Real-time Inventory:**
- Stock levels update immediately
- No manual intervention needed
- Accurate at all times

✅ **Warehouse Tracking:**
- Every stock movement is linked to a warehouse
- Shows actual items and quantities in each warehouse
- Tracks warehouse capacity usage

✅ **Comprehensive View:**
- See all purchases made for a warehouse
- See actual current stock levels
- See production output in warehouse
- Track all movements

### 6. Data Flow Diagram

```
PURCHASE → Creates Purchase Record
         ↓
         Creates Stock Movement (type: 'in')
         ↓
         Updates Inventory.currentStock (+)
         ↓
         Updates Warehouse.capacity.currentUsage (+)


SALE → Creates Sale Record
      ↓
      Creates Stock Movement (type: 'out')
      ↓
      Updates Inventory.currentStock (-)
      ↓
      Updates Warehouse.capacity.currentUsage (-)


WAREHOUSE DETAIL → Shows:
                  - Purchase history
                  - Actual current stock (from Stock movements)
                  - Production output
                  - Summary statistics
```

### 7. Using the System

#### To Add Stock:
1. Go to Purchase page
2. Select warehouse
3. Add items (bags, food, etc.)
4. Submit purchase
5. Stock is automatically added ✓

#### To Sell Stock:
1. Go to Sales page
2. Select warehouse
3. Add products to sell
4. System validates stock availability
5. Submit sale
6. Stock is automatically deducted ✓

#### To View Warehouse Stock:
1. Go to Warehouses page
2. Click on a warehouse
3. View the detail screen with tabs:
   - Bags Inventory: Shows bag purchases
   - Wheat Inventory: Shows wheat purchases
   - Production Products: Shows production output
   - **Actual Stock**: Shows REAL-TIME current stock levels

### 8. Benefits

✅ **Accurate Stock Levels** - Always know what's in your warehouse
✅ **Automatic Updates** - No manual data entry
✅ **Complete Traceability** - Track every movement
✅ **Warehouse Isolation** - Each warehouse's stock is tracked separately
✅ **Real-time Visibility** - See current stock levels instantly
✅ **Audit Trail** - Every movement is recorded with reason and reference

### 9. Technical Implementation

- **Stock Model**: Tracks all movements with warehouse reference
- **Pre-save Middleware**: Automatically updates inventory and warehouse capacity
- **Aggregation Logic**: Warehouse detail endpoint calculates actual stock from movements
- **Multi-model Support**: Handles Purchase, BagPurchase, FoodPurchase models
- **Automatic Inventory Creation**: Creates inventory items on-the-fly if needed

## Conclusion

The system now fully tracks all warehouse stock automatically. When you make a purchase with a selected warehouse, the products are added to that warehouse's stock. When you make a sale from a warehouse, the products are deducted. The warehouse detail screen shows you exactly what products and quantities are currently in each warehouse.

