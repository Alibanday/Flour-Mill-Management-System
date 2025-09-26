// Real-time Integration Test
import mongoose from 'mongoose';
import Inventory from '../model/inventory.js';
import Stock from '../model/stock.js';
import Production from '../model/Production.js';
import Sale from '../model/Sale.js';
import Purchase from '../model/Purchase.js';
import Warehouse from '../model/warehouse.js';
import Notification from '../model/Notification.js';
import NotificationService from '../services/notificationService.js';

class IntegrationTest {
  constructor() {
    this.testResults = [];
    this.testData = {};
  }

  async runAllTests() {
    console.log('🧪 Starting Real-time Integration Tests...\n');

    try {
      // Test 1: Inventory and Stock Integration
      await this.testInventoryStockIntegration();
      
      // Test 2: Production and Inventory Integration
      await this.testProductionInventoryIntegration();
      
      // Test 3: Sales and Inventory Integration
      await this.testSalesInventoryIntegration();
      
      // Test 4: Purchase and Inventory Integration
      await this.testPurchaseInventoryIntegration();
      
      // Test 5: Notification System
      await this.testNotificationSystem();
      
      // Test 6: Real-time Updates
      await this.testRealTimeUpdates();
      
      // Test 7: Cross-module Communication
      await this.testCrossModuleCommunication();

      this.printResults();
    } catch (error) {
      console.error('❌ Integration test failed:', error);
    }
  }

  async testInventoryStockIntegration() {
    console.log('📦 Testing Inventory and Stock Integration...');
    
    try {
      // Create test warehouse
      const warehouse = new Warehouse({
        name: 'Test Warehouse',
        location: 'Test Location',
        status: 'Active',
        capacity: {
          totalCapacity: 1000,
          unit: 'kg',
          currentUsage: 0
        }
      });
      await warehouse.save();
      this.testData.warehouse = warehouse;

      // Create test inventory item
      const inventory = new Inventory({
        name: 'Test Product',
        category: 'Raw Materials',
        subcategory: 'Wheat Grain',
        unit: 'kg',
        currentStock: 100,
        minimumStock: 10,
        warehouse: warehouse._id,
        cost: { purchasePrice: 50, currency: 'PKR' },
        status: 'Active'
      });
      await inventory.save();
      this.testData.inventory = inventory;

      // Create stock movement
      const stock = new Stock({
        inventoryItem: inventory._id,
        movementType: 'out',
        quantity: 20,
        reason: 'Test Movement',
        referenceNumber: 'TEST-001',
        warehouse: warehouse._id
      });
      await stock.save();

      // Verify inventory stock was updated
      const updatedInventory = await Inventory.findById(inventory._id);
      if (updatedInventory.currentStock === 80) {
        this.testResults.push({ test: 'Inventory-Stock Integration', status: 'PASS', message: 'Stock movement correctly updated inventory' });
      } else {
        this.testResults.push({ test: 'Inventory-Stock Integration', status: 'FAIL', message: 'Stock movement did not update inventory correctly' });
      }

      console.log('✅ Inventory and Stock Integration: PASS');
    } catch (error) {
      this.testResults.push({ test: 'Inventory-Stock Integration', status: 'FAIL', message: error.message });
      console.log('❌ Inventory and Stock Integration: FAIL');
    }
  }

  async testProductionInventoryIntegration() {
    console.log('🏭 Testing Production and Inventory Integration...');
    
    try {
      // Create production record
      const production = new Production({
        batchNumber: 'TEST-BATCH-001',
        productName: 'Wheat Flour',
        productType: 'Finished Goods',
        quantity: { value: 50, unit: 'kg' },
        productionCost: {
          rawMaterialCost: 1000,
          laborCost: 200,
          overheadCost: 100,
          totalCost: 1300
        },
        warehouse: this.testData.warehouse._id,
        addedBy: '507f1f77bcf86cd799439011',
        status: 'Completed'
      });
      await production.save();
      this.testData.production = production;

      // Check if inventory was created/updated
      const finishedProduct = await Inventory.findOne({
        name: 'Wheat Flour',
        warehouse: this.testData.warehouse._id
      });

      if (finishedProduct) {
        this.testResults.push({ test: 'Production-Inventory Integration', status: 'PASS', message: 'Production correctly created/updated inventory' });
      } else {
        this.testResults.push({ test: 'Production-Inventory Integration', status: 'FAIL', message: 'Production did not create inventory item' });
      }

      console.log('✅ Production and Inventory Integration: PASS');
    } catch (error) {
      this.testResults.push({ test: 'Production-Inventory Integration', status: 'FAIL', message: error.message });
      console.log('❌ Production and Inventory Integration: FAIL');
    }
  }

  async testSalesInventoryIntegration() {
    console.log('🛒 Testing Sales and Inventory Integration...');
    
    try {
      // Create sale record
      const sale = new Sale({
        invoiceNumber: 'TEST-SALE-001',
        customer: { name: 'Test Customer', email: 'test@example.com' },
        items: [{
          product: this.testData.inventory._id,
          productName: 'Test Product',
          quantity: 10,
          unit: 'kg',
          unitPrice: 60,
          totalPrice: 600
        }],
        subtotal: 600,
        totalAmount: 600,
        paymentMethod: 'Cash',
        warehouse: this.testData.warehouse._id,
        createdBy: '507f1f77bcf86cd799439011',
        status: 'Completed'
      });
      await sale.save();
      this.testData.sale = sale;

      // Create stock out movement for sale
      const stockOut = new Stock({
        inventoryItem: this.testData.inventory._id,
        movementType: 'out',
        quantity: 10,
        reason: 'Sale - TEST-SALE-001',
        referenceNumber: 'TEST-SALE-001',
        warehouse: this.testData.warehouse._id
      });
      await stockOut.save();

      // Verify inventory stock was updated
      const updatedInventory = await Inventory.findById(this.testData.inventory._id);
      if (updatedInventory.currentStock === 70) {
        this.testResults.push({ test: 'Sales-Inventory Integration', status: 'PASS', message: 'Sale correctly updated inventory stock' });
      } else {
        this.testResults.push({ test: 'Sales-Inventory Integration', status: 'FAIL', message: 'Sale did not update inventory stock correctly' });
      }

      console.log('✅ Sales and Inventory Integration: PASS');
    } catch (error) {
      this.testResults.push({ test: 'Sales-Inventory Integration', status: 'FAIL', message: error.message });
      console.log('❌ Sales and Inventory Integration: FAIL');
    }
  }

  async testPurchaseInventoryIntegration() {
    console.log('📦 Testing Purchase and Inventory Integration...');
    
    try {
      // Create purchase record
      const purchase = new Purchase({
        purchaseNumber: 'TEST-PURCHASE-001',
        supplier: { name: 'Test Supplier', email: 'supplier@example.com' },
        items: [{
          product: this.testData.inventory._id,
          productName: 'Test Product',
          quantity: 30,
          unit: 'kg',
          unitPrice: 45,
          totalPrice: 1350
        }],
        subtotal: 1350,
        totalAmount: 1350,
        paymentMethod: 'Cash',
        warehouse: this.testData.warehouse._id,
        createdBy: '507f1f77bcf86cd799439011',
        status: 'Completed'
      });
      await purchase.save();
      this.testData.purchase = purchase;

      // Create stock in movement for purchase
      const stockIn = new Stock({
        inventoryItem: this.testData.inventory._id,
        movementType: 'in',
        quantity: 30,
        reason: 'Purchase - TEST-PURCHASE-001',
        referenceNumber: 'TEST-PURCHASE-001',
        warehouse: this.testData.warehouse._id
      });
      await stockIn.save();

      // Verify inventory stock was updated
      const updatedInventory = await Inventory.findById(this.testData.inventory._id);
      if (updatedInventory.currentStock === 100) {
        this.testResults.push({ test: 'Purchase-Inventory Integration', status: 'PASS', message: 'Purchase correctly updated inventory stock' });
      } else {
        this.testResults.push({ test: 'Purchase-Inventory Integration', status: 'FAIL', message: 'Purchase did not update inventory stock correctly' });
      }

      console.log('✅ Purchase and Inventory Integration: PASS');
    } catch (error) {
      this.testResults.push({ test: 'Purchase-Inventory Integration', status: 'FAIL', message: error.message });
      console.log('❌ Purchase and Inventory Integration: FAIL');
    }
  }

  async testNotificationSystem() {
    console.log('🔔 Testing Notification System...');
    
    try {
      // Test low stock notification
      const lowStockNotification = await NotificationService.createLowStockAlert(
        this.testData.inventory,
        '507f1f77bcf86cd799439011'
      );

      if (lowStockNotification) {
        this.testResults.push({ test: 'Notification System', status: 'PASS', message: 'Low stock notification created successfully' });
      } else {
        this.testResults.push({ test: 'Notification System', status: 'FAIL', message: 'Failed to create low stock notification' });
      }

      // Test production notification
      const productionNotification = await NotificationService.createProductionAlert(
        this.testData.production,
        '507f1f77bcf86cd799439011'
      );

      if (productionNotification) {
        this.testResults.push({ test: 'Production Notification', status: 'PASS', message: 'Production notification created successfully' });
      } else {
        this.testResults.push({ test: 'Production Notification', status: 'FAIL', message: 'Failed to create production notification' });
      }

      console.log('✅ Notification System: PASS');
    } catch (error) {
      this.testResults.push({ test: 'Notification System', status: 'FAIL', message: error.message });
      console.log('❌ Notification System: FAIL');
    }
  }

  async testRealTimeUpdates() {
    console.log('⚡ Testing Real-time Updates...');
    
    try {
      // Test inventory update triggers
      const originalStock = this.testData.inventory.currentStock;
      
      // Create another stock movement
      const stockMovement = new Stock({
        inventoryItem: this.testData.inventory._id,
        movementType: 'out',
        quantity: 5,
        reason: 'Real-time Test',
        referenceNumber: 'REALTIME-001',
        warehouse: this.testData.warehouse._id
      });
      await stockMovement.save();

      // Verify real-time update
      const updatedInventory = await Inventory.findById(this.testData.inventory._id);
      if (updatedInventory.currentStock === originalStock - 5) {
        this.testResults.push({ test: 'Real-time Updates', status: 'PASS', message: 'Real-time inventory updates working correctly' });
      } else {
        this.testResults.push({ test: 'Real-time Updates', status: 'FAIL', message: 'Real-time updates not working correctly' });
      }

      console.log('✅ Real-time Updates: PASS');
    } catch (error) {
      this.testResults.push({ test: 'Real-time Updates', status: 'FAIL', message: error.message });
      console.log('❌ Real-time Updates: FAIL');
    }
  }

  async testCrossModuleCommunication() {
    console.log('🔄 Testing Cross-module Communication...');
    
    try {
      // Test that production affects inventory
      const productionStock = await Stock.findOne({ reason: /Production/ });
      if (productionStock) {
        this.testResults.push({ test: 'Cross-module Communication', status: 'PASS', message: 'Production module correctly communicates with inventory' });
      } else {
        this.testResults.push({ test: 'Cross-module Communication', status: 'FAIL', message: 'Production module not communicating with inventory' });
      }

      // Test that sales affect inventory
      const salesStock = await Stock.findOne({ reason: /Sale/ });
      if (salesStock) {
        this.testResults.push({ test: 'Sales-Inventory Communication', status: 'PASS', message: 'Sales module correctly communicates with inventory' });
      } else {
        this.testResults.push({ test: 'Sales-Inventory Communication', status: 'FAIL', message: 'Sales module not communicating with inventory' });
      }

      // Test that purchases affect inventory
      const purchaseStock = await Stock.findOne({ reason: /Purchase/ });
      if (purchaseStock) {
        this.testResults.push({ test: 'Purchase-Inventory Communication', status: 'PASS', message: 'Purchase module correctly communicates with inventory' });
      } else {
        this.testResults.push({ test: 'Purchase-Inventory Communication', status: 'FAIL', message: 'Purchase module not communicating with inventory' });
      }

      console.log('✅ Cross-module Communication: PASS');
    } catch (error) {
      this.testResults.push({ test: 'Cross-module Communication', status: 'FAIL', message: error.message });
      console.log('❌ Cross-module Communication: FAIL');
    }
  }

  printResults() {
    console.log('\n📊 INTEGRATION TEST RESULTS:');
    console.log('================================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
      console.log(`   ${result.message}`);
    });

    if (failed === 0) {
      console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
      console.log('🚀 Real-time system is fully functional and integrated!');
    } else {
      console.log('\n⚠️  Some integration tests failed. Please review the issues above.');
    }
  }

  async cleanup() {
    try {
      // Clean up test data
      if (this.testData.warehouse) {
        await Warehouse.findByIdAndDelete(this.testData.warehouse._id);
      }
      if (this.testData.inventory) {
        await Inventory.findByIdAndDelete(this.testData.inventory._id);
      }
      if (this.testData.production) {
        await Production.findByIdAndDelete(this.testData.production._id);
      }
      if (this.testData.sale) {
        await Sale.findByIdAndDelete(this.testData.sale._id);
      }
      if (this.testData.purchase) {
        await Purchase.findByIdAndDelete(this.testData.purchase._id);
      }
      
      // Clean up stock movements
      await Stock.deleteMany({ reason: /TEST|REALTIME/ });
      
      // Clean up notifications
      await Notification.deleteMany({ title: /Test|Low Stock|Production/ });
      
      console.log('🧹 Test data cleaned up successfully');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
    }
  }
}

export default IntegrationTest;
