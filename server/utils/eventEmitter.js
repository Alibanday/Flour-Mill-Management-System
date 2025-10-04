import { EventEmitter } from 'events';

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Increase max listeners
  }

  // Emit inventory update event
  emitInventoryUpdate(inventoryId, updateData) {
    this.emit('inventory:updated', { inventoryId, updateData });
  }

  // Emit stock update event
  emitStockUpdate(stockId, updateData) {
    this.emit('stock:updated', { stockId, updateData });
  }

  // Emit warehouse update event
  emitWarehouseUpdate(warehouseId, updateData) {
    this.emit('warehouse:updated', { warehouseId, updateData });
  }

  // Emit production update event
  emitProductionUpdate(productionId, updateData) {
    this.emit('production:updated', { productionId, updateData });
  }

  // Emit sales update event
  emitSalesUpdate(salesId, updateData) {
    this.emit('sales:updated', { salesId, updateData });
  }

  // Emit purchase update event
  emitPurchaseUpdate(purchaseId, updateData) {
    this.emit('purchase:updated', { purchaseId, updateData });
  }

  // Emit employee update event
  emitEmployeeUpdate(employeeId, updateData) {
    this.emit('employee:updated', { employeeId, updateData });
  }

  // Emit customer update event
  emitCustomerUpdate(customerId, updateData) {
    this.emit('customer:updated', { customerId, updateData });
  }

  // Emit notification event
  emitNotification(notificationData) {
    this.emit('notification:created', notificationData);
  }
}

// Create and export a singleton instance
const appEventEmitter = new AppEventEmitter();

// Export the sendRealtimeEvent function that controllers expect
export const sendRealtimeEvent = (event, data) => {
  appEventEmitter.emit(event, data);
};

export default appEventEmitter;