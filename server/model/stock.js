import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  // Reference to existing inventory item
  inventoryItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Inventory', 
    required: true 
  },
  
  // Simple stock movement
  movementType: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  
  // Quantity moved
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Reason for movement
  reason: {
    type: String,
    required: true
  },
  
  // Reference number (invoice, PO, etc.)
  referenceNumber: String,
  
  // Warehouse
  warehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse', 
    required: true 
  },
  
  // Audit Trail
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better performance
stockSchema.index({ inventoryItem: 1, warehouse: 1 });
stockSchema.index({ movementType: 1 });
stockSchema.index({ createdAt: -1 });
// Pre-save middleware to update inventory stock and validate movements
stockSchema.pre('save', async function(next) {
  try {
    const Inventory = mongoose.model('Inventory');
    const Warehouse = mongoose.model('Warehouse');
    
    const inventory = await Inventory.findById(this.inventoryItem);
    if (!inventory) {
      throw new Error('Inventory item not found');
    }
    
    const warehouse = await Warehouse.findById(this.warehouse);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }
    
    // Ensure inventory has warehouse set (for new structure)
    if (!inventory.warehouse) {
      inventory.warehouse = this.warehouse;
    }
    
    // Ensure inventory warehouse matches stock warehouse
    if (inventory.warehouse && inventory.warehouse.toString() !== this.warehouse.toString()) {
      throw new Error(`Inventory warehouse mismatch. Inventory is in warehouse ${inventory.warehouse}, but stock movement is for warehouse ${this.warehouse}`);
    }
    
    // For 'out' movements, check if there's sufficient stock
    if (this.movementType === 'out') {
      // Use currentStock if available, otherwise fall back to weight for backward compatibility
      const availableStock = inventory.currentStock !== undefined ? inventory.currentStock : (inventory.weight || 0);
      if (availableStock < this.quantity) {
        throw new Error(`Insufficient stock available. Current stock: ${availableStock}, Requested: ${this.quantity}`);
      }
    }
    
    // For 'in' movements, check warehouse capacity and reasonable limits
    if (this.movementType === 'in') {
      // Check warehouse capacity
      if (warehouse.capacity && warehouse.capacity.totalCapacity) {
        const currentUsage = warehouse.capacity.currentUsage || 0;
        const newUsage = currentUsage + this.quantity;
        
        if (newUsage > warehouse.capacity.totalCapacity) {
          throw new Error(`Warehouse capacity exceeded. Available capacity: ${warehouse.capacity.totalCapacity - currentUsage}, Requested: ${this.quantity}`);
        }
      }
      
      // Check reasonable stock addition limits - allow up to current stock size
      // Exception: Allow stock additions to newly created inventory items (currentStock = 0) during transfers
      const currentStock = inventory.currentStock !== undefined ? inventory.currentStock : (inventory.weight || 0);
      const maxReasonableAddition = currentStock;
      if (this.quantity > maxReasonableAddition && currentStock > 0) {
        throw new Error(`Stock addition too large. Current stock: ${currentStock}, Maximum allowed: ${maxReasonableAddition}, Requested: ${this.quantity}`);
      }
    }
    
    // Only update inventory stock if this is NOT an initial stock movement
    if (this.reason !== 'Initial Stock') {
      // Initialize currentStock if it doesn't exist (backward compatibility)
      if (inventory.currentStock === undefined) {
        inventory.currentStock = inventory.weight || 0;
      }
      
      // Update inventory stock based on movement type
      if (this.movementType === 'in') {
        inventory.currentStock += this.quantity;
      } else if (this.movementType === 'out') {
        inventory.currentStock = Math.max(0, inventory.currentStock - this.quantity);
      }
      
      // Update inventory status based on new stock level
      if (inventory.currentStock === 0) {
        inventory.status = "Out of Stock";
      } else if (inventory.minimumStock && inventory.currentStock <= inventory.minimumStock) {
        inventory.status = "Low Stock";
      } else {
        inventory.status = "Active";
      }
      
      await inventory.save();
      
      // Update warehouse capacity usage
      if (warehouse.capacity && warehouse.capacity.totalCapacity) {
        if (this.movementType === 'in') {
          warehouse.capacity.currentUsage = (warehouse.capacity.currentUsage || 0) + this.quantity;
        } else if (this.movementType === 'out') {
          warehouse.capacity.currentUsage = Math.max(0, (warehouse.capacity.currentUsage || 0) - this.quantity);
        }
        await warehouse.save();
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;