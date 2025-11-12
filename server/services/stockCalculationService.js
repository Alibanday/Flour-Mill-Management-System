import Stock from '../model/stock.js';
import Inventory from '../model/inventory.js';

/**
 * Calculate current stock for an inventory item from Stock movements
 * @param {String} inventoryItemId - The inventory item ID
 * @returns {Promise<Number>} - The calculated current stock
 */
export const calculateCurrentStock = async (inventoryItemId) => {
  try {
    const stockMovements = await Stock.find({ inventoryItem: inventoryItemId });
    
    let currentStock = 0;
    
    for (const movement of stockMovements) {
      if (movement.reason === 'Initial Stock') {
        // Initial stock sets the base
        currentStock = movement.quantity;
      } else {
        // Regular movements add or subtract
        if (movement.movementType === 'in') {
          currentStock += movement.quantity;
        } else if (movement.movementType === 'out') {
          currentStock = Math.max(0, currentStock - movement.quantity);
        }
      }
    }
    
    return currentStock;
  } catch (error) {
    console.error('Error calculating current stock:', error);
    throw error;
  }
};

/**
 * Recalculate and update currentStock for a specific inventory item
 * @param {String} inventoryItemId - The inventory item ID
 * @returns {Promise<Object>} - Updated inventory item
 */
export const recalculateInventoryStock = async (inventoryItemId) => {
  try {
    const inventory = await Inventory.findById(inventoryItemId);
    if (!inventory) {
      throw new Error('Inventory item not found');
    }
    
    const calculatedStock = await calculateCurrentStock(inventoryItemId);
    inventory.currentStock = calculatedStock;
    
    // Update status based on new stock level
    if (inventory.currentStock === 0) {
      inventory.status = "Out of Stock";
    } else if (inventory.minimumStock && inventory.currentStock <= inventory.minimumStock) {
      inventory.status = "Low Stock";
    } else {
      inventory.status = "Active";
    }
    
    await inventory.save();
    return inventory;
  } catch (error) {
    console.error('Error recalculating inventory stock:', error);
    throw error;
  }
};

/**
 * Recalculate currentStock for all inventory items
 * This is useful for migration or fixing data inconsistencies
 * @returns {Promise<Object>} - Summary of the migration
 */
export const recalculateAllInventoryStock = async () => {
  try {
    const allInventory = await Inventory.find({});
    let updated = 0;
    let errors = 0;
    const errorsList = [];
    
    for (const inventory of allInventory) {
      try {
        // If currentStock is already set and we have stock movements, recalculate
        // Otherwise, initialize from weight if no stock movements exist
        const stockMovements = await Stock.find({ inventoryItem: inventory._id });
        
        if (stockMovements.length > 0) {
          // Calculate from stock movements
          const calculatedStock = await calculateCurrentStock(inventory._id);
          inventory.currentStock = calculatedStock;
        } else {
          // No stock movements, initialize from weight for backward compatibility
          if (inventory.currentStock === undefined) {
            inventory.currentStock = inventory.weight || 0;
          }
        }
        
        // Update status based on new stock level
        if (inventory.currentStock === 0) {
          inventory.status = "Out of Stock";
        } else if (inventory.minimumStock && inventory.currentStock <= inventory.minimumStock) {
          inventory.status = "Low Stock";
        } else {
          inventory.status = "Active";
        }
        
        await inventory.save();
        updated++;
      } catch (error) {
        errors++;
        errorsList.push({
          itemId: inventory._id,
          itemName: inventory.name,
          error: error.message
        });
        console.error(`Error updating inventory ${inventory.name}:`, error);
      }
    }
    
    return {
      success: true,
      total: allInventory.length,
      updated,
      errors,
      errorsList
    };
  } catch (error) {
    console.error('Error in bulk stock recalculation:', error);
    throw error;
  }
};

